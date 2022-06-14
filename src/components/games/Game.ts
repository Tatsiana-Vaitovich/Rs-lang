import { WordState } from './../../RSLangSS/index';
import { StatDataGameType } from './../../services/StatisticsService';
import { Statistics, StatKeysType, StatDateLearnedType } from './../../states/statisticsState';
import { filterWordService, IAggr, IAgregatedWord } from './../../services/FilterWordsService';
import { logInData } from './../../states/logInData';
import { userWordsService, INewWordRequest, INewWord, IUserWordsResponse } from './../../services/UserWordsService';
import { Page } from '../../core/templates/page';
import { IWord } from '../../services/WordsService';
import { wordService } from './../../services/WordsService';
import getRandomInt from '../../common/getRandomInt';
import { Preloader } from '../../common/preloader';
import './stylesheet.scss';
import { PageIds } from '../../app';

enum Difficulty {
  easy = 'easy',
  hard = 'hard',
  normal = 'normal',
}
export abstract class Game extends Page {
  protected title: string;

  protected currentPage: number | undefined;

  protected currentGroup: number | undefined;

  protected itemsList: IWord[] | IAgregatedWord[] | undefined = undefined;

  protected ResultItems: IWord[] | Omit<IAgregatedWord, 'userWord'>[] | undefined = [];

  protected currentItem = 0;

  protected results: boolean[] = [];

  protected newWords = 0;

  protected sequence = 0;

  protected bestSequence = 0;

  protected maxItemsAmount = 20;

  protected name: keyof StatKeysType;

  protected URL = 'https://rslang-js.herokuapp.com/';

  protected correctSound = './assets/sounds/correct.mp3';

  protected wrongSound = './assets/sounds/wrong.mp3';

  protected MAX_PAGE = 29;

  protected MIN_PAGE = 0;

  constructor(id: string, title: string, name: keyof StatKeysType, page?: number, group?: number) {
    super(id);
    this.title = title;
    this.currentGroup = group;
    this.currentPage = page;
    this.name = name;
    let items: Promise<IWord[] | undefined> | null = null;
    let difficultItems: Promise<IAggr[] | undefined> | null = null;
    const IS_NUM = typeof page === 'number';
    if (IS_NUM && page < 0 && logInData.isAutorizated) {
      difficultItems = this.getFiltredItems(Difficulty.hard);
    } else if (IS_NUM && logInData.isAutorizated) {
      items = this.filterLearnedItems(group!, page);
    } else if (IS_NUM) {
      items = this.getGameItems(group!, page);
    } else {
      this.renderMenu();
    }
    if (items) {
      Preloader.showPreloader();
      items.then((arr) => {
        this.itemsList = arr;
        this.startGame();
        Preloader.hidePreloader();
      });
    }

    if (difficultItems) {
      Preloader.showPreloader();
      difficultItems.then((arr) => {
        this.itemsList = arr![0].paginatedResults;
        this.startGame();
        Preloader.hidePreloader();
      });
    }
  }

  render() {
    const title = this.createHeaderTitle(this.title);
    title.classList.add('visually-hidden');
    this.container.classList.add('game');
    this.container.append(title);
    return this.container;
  }

  abstract startGame(): void;

  private renderMenu() {
    const MENU_CONTAINER = document.createElement('div');
    const DESCRIPTION = document.createElement('p');
    const SELECT_CONTAINER = document.createElement('div');
    const GROUP_SELECT = document.createElement('select');
    const START_BUTTON = document.createElement('button');
    const BUTTON_TEXT = 'Cтарт';
    const DESCRIPTION_TEXT = 'Выберите сложность';
    for (let i = 0; i < 6; i++) {
      const OPTION = document.createElement('option');
      OPTION.textContent = String(i + 1);
      OPTION.value = String(i);
      GROUP_SELECT.append(OPTION);
    }
    SELECT_CONTAINER.classList.add('game__select');
    SELECT_CONTAINER.append(GROUP_SELECT);
    START_BUTTON.textContent = BUTTON_TEXT;
    START_BUTTON.classList.add('game__menu-button');
    DESCRIPTION.textContent = DESCRIPTION_TEXT;
    MENU_CONTAINER.classList.add('game__menu');
    MENU_CONTAINER.append(DESCRIPTION, SELECT_CONTAINER, START_BUTTON);
    this.container.append(MENU_CONTAINER);
    START_BUTTON.addEventListener('click', async () => {
      Preloader.showPreloader();
      this.currentGroup = Number(GROUP_SELECT.value);
      const ITEMS = await this.getGameItems(this.currentGroup);
      this.itemsList = ITEMS!;
      MENU_CONTAINER.remove();
      this.startGame();
      Preloader.hidePreloader();
    });
  }

  protected async getGameItems(group: number, page?: number, filtred?: boolean) {
    const IS_NUM = typeof page === 'number';
    if (!IS_NUM) {
      page = getRandomInt(this.MIN_PAGE, this.MAX_PAGE);
      this.currentPage = page;
    }
    let items = await wordService.getWords(page!, group);
    if (filtred) {
      const LEARNED = await this.getFiltredItems(Difficulty.easy);
      const IDS = LEARNED![0].paginatedResults.map((elem) => elem._id);
      items = items?.filter((elem) => {
        return !IDS?.includes(elem.id);
      });
    }
    return items;
  }

  protected async filterLearnedItems(group: number, page: number) {
    const ITEMS = [];
    let currentPage = page;
    while (currentPage >= 0 && ITEMS.length < this.maxItemsAmount) {
      const FILTRED = await this.getGameItems(group, currentPage--, true);
      ITEMS.push(...FILTRED!);
    }
    if (ITEMS.length > 20) return ITEMS.slice(0, 20);
    return ITEMS;
  }

  private async getFiltredItems(diff: string) {
    const ITEMS = await filterWordService.getAggregatedWords(logInData.userId!, logInData.token!, `{"userWord.difficulty":"${diff}"}`, 3600);
    return ITEMS;
  }

  protected async updateUserWordInfo(wordId: string, status: boolean, word = '') {
    const TOKEN = logInData.token;
    const userId = logInData.userId;
    if (!logInData.isAutorizated || !TOKEN || !userId) return;

    const ITEMS = await userWordsService.getUserWords(userId, TOKEN);
    const ITEM = ITEMS!.find((elem) => elem.wordId === wordId);
    if (ITEM) {
      this.updateWordStats(null, ITEM, status, word);
      userWordsService.editUserWord({ userId, wordId, word: { difficulty: ITEM.difficulty, optional: ITEM.optional } }, TOKEN);
    } else {
      const DATA = this.createWordData(userId, wordId);
      this.updateWordStats(DATA, null, status, word);
      userWordsService.createUserWord(DATA, TOKEN);
    }
  }

  private createWordData(userId: string, wordId: string) {
    const DATA: INewWordRequest = {
      userId,
      wordId,
      word: {
        difficulty: Difficulty.normal,
        optional: {
          trueAnswer: 0,
          falseAnswer: 0,
        },
      },
    };
    return DATA;
  }

  private updateWordStats(requestWord?: INewWordRequest | null, responseWord?: IUserWordsResponse | null, status?: boolean, word?: string) {
    const KEY = 'learned';
    const STATISTIC_DATA: StatDateLearnedType = {
      word: word!,
      add: status!,
    };
    const DATA: INewWordRequest | INewWord | undefined = responseWord ? responseWord : requestWord?.word;
    if (!DATA?.optional?.falseAnswer && !DATA?.optional?.trueAnswer) this.newWords++;
    if (status) {
      DATA!.optional!.trueAnswer += 1;
    } else {
      DATA!.optional!.falseAnswer += 1;
      if (DATA?.difficulty === Difficulty.easy) DATA.difficulty = Difficulty.normal;
      Statistics.updateStat(KEY, STATISTIC_DATA);
    }

    if (DATA!.optional!.trueAnswer >= 3 && DATA?.difficulty === Difficulty.normal) {
      DATA.difficulty = Difficulty.easy;
      Statistics.updateStat(KEY, STATISTIC_DATA);
    }
    if (DATA!.optional!.trueAnswer >= 5 && DATA?.difficulty === Difficulty.hard) {
      DATA.difficulty = Difficulty.easy;
      Statistics.updateStat(KEY, STATISTIC_DATA);
    }
  }

  private sendStats() {
    const DATA: StatDataGameType = {
      newWords: this.newWords,
      rightAnsw: this.results.reduce((acc, elem) => acc + Number(elem), 0),
      questions: this.results.length,
      session: this.bestSequence,
    };
    Statistics.updateStat(this.name, DATA);
  }

  protected renderResults(score?: number) {
    if (logInData.isAutorizated) this.sendStats();
    const RESULTS_CONTAINER = document.createElement('div');
    const RESULTS_CONTENT = document.createElement('div');
    const RESULTS_TABLE = document.createElement('table');
    const RESTART_BUTTON = document.createElement('button');
    const SCORE = document.createElement('p');
    RESTART_BUTTON.textContent = 'Restart';
    if (score) {
      SCORE.textContent = `Вы заработали ${score} очков`;
    }
    this.results.forEach((result, index) => {
      const LINE = this.getResultLine(result, index);
      RESULTS_TABLE.append(LINE);
    });
    RESULTS_CONTENT.append(SCORE, RESULTS_TABLE);
    RESULTS_CONTENT.classList.add('game__result-table', 'game__result-table-content');
    RESULTS_CONTAINER.append(this.getResultsHeading(), RESULTS_CONTENT, RESTART_BUTTON);
    RESULTS_CONTAINER.classList.add('game__results');
    this.container.innerHTML = '';
    this.container.append(RESULTS_CONTAINER);
    RESTART_BUTTON.addEventListener('click', () => {
      window.location.reload();
    });
  }

  protected getResultsHeading() {
    const CONTAINER = document.createElement('div');
    const TABLE = document.createElement('table');
    const THEAD = document.createElement('thead');
    const TR = document.createElement('tr');
    const HEADINGS = ['Audio', 'Word', 'Translate', 'Transcription', 'Result'];
    HEADINGS.forEach((str) => {
      const TH = document.createElement('th');
      TH.classList.add('game__result-table-th');
      TH.textContent = str;
      TR.append(TH);
    });
    THEAD.append(TR);
    TABLE.append(THEAD);
    CONTAINER.append(TABLE);
    CONTAINER.classList.add('game__result-table', 'game__result-table-header');
    return CONTAINER;
  }

  private getResultLine(result: boolean, index: number) {
    const LINE = document.createElement('tr');
    const sound = document.createElement('audio');
    sound.src = this.URL + this.ResultItems![index].audio;
    const soundIcon = document.createElement('img');
    soundIcon.src = './assets/svg/sound.svg';
    soundIcon.addEventListener('click', () => sound.play());
    soundIcon.classList.add('game__sound-icon');
    const RESULT_ITEMS = [
      soundIcon,
      this.ResultItems![index].word,
      this.ResultItems![index].wordTranslate,
      this.ResultItems![index].transcription,
      result ? '✔️' : '❌',
    ];
    RESULT_ITEMS.forEach((content) => {
      const TD = document.createElement('td');
      TD.classList.add('game__result-table-td');
      if (typeof content === 'string') TD.textContent = content;
      else TD.append(content);
      LINE.append(TD);
    });
    return LINE;
  }

  protected playSound(result: boolean) {
    const SOUND = document.createElement('audio');
    const SRC = result ? this.correctSound : this.wrongSound;
    SOUND.src = SRC;
    SOUND.play();
  }
}
