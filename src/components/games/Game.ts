import { StatDataGameType } from './../../services/StatisticsService';
import { Statistics, StatKeysType, StatDateLearnedType } from './../../states/statisticsState';
import { filterWordService } from './../../services/FilterWordsService';
import { logInData } from './../../states/logInData';
import { userWordsService, INewWordRequest } from './../../services/UserWordsService';
import { Page } from '../../core/templates/page';
import { IWord } from '../../services/WordsService';
import { wordService } from './../../services/WordsService';
import getRandomInt from '../../common/getRandomInt';
import { Preloader } from '../../common/preloader';
import './stylesheet.scss';
enum Difficulty {
  easy = 'easy',
  hard = 'hard',
  normal = 'normal',
}
export abstract class Game extends Page {
  protected title: string;

  protected itemsList: IWord[] | null = null;

  protected currentItem = 0;

  protected results: boolean[] = [];

  protected newWords = 0;

  protected sequence = 0;

  protected bestSequence = 0;

  protected maxItemsAmount = 20;

  protected name: keyof StatKeysType;

  protected URL = `https://rslang-js.herokuapp.com/`;

  constructor(id: string, title: string, name: keyof StatKeysType, page?: number, group?: number) {
    super(id);
    this.title = title;
    this.name = name;
    let items: Promise<IWord[] | undefined> | null = null;
    Preloader.showPreloader();
    if (page && group && logInData.isAutorizated) {
      items = this.filterLearnedItems(page, group);
    } else if (page && group) {
      items = this.getGameItems(page, group);
    } else {
      this.renderMenu();
    }
    if (items)
      items.then((arr) => {
        this.itemsList = arr!;
        this.startGame();
      });
    Preloader.hidePreloader();
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
    SELECT_CONTAINER.classList.add('select');
    SELECT_CONTAINER.append(GROUP_SELECT);
    START_BUTTON.textContent = BUTTON_TEXT;
    START_BUTTON.classList.add('game__menu-button');
    DESCRIPTION.textContent = DESCRIPTION_TEXT;
    MENU_CONTAINER.classList.add('game__menu');
    MENU_CONTAINER.append(DESCRIPTION, SELECT_CONTAINER, START_BUTTON);
    this.container.append(MENU_CONTAINER);
    START_BUTTON.addEventListener('click', async () => {
      Preloader.showPreloader();
      const ITEMS = await this.getGameItems(Number(GROUP_SELECT.value));
      this.itemsList = ITEMS!;
      MENU_CONTAINER.remove();
      this.startGame();
      Preloader.hidePreloader();
    });
  }

  private async getGameItems(group: number, page?: number, filtred?: boolean) {
    const MIN = 0;
    const MAX = 29;
    if (!page) page = getRandomInt(MIN, MAX);
    let items = await wordService.getWords(page, group);
    if (filtred) {
      const LEARNED = await this.getDifficultyFiltredItems(Difficulty.easy);
      const IDS = LEARNED?.map((elem, index) => elem.paginatedResults[index].id);
      items = items?.filter((elem) => !IDS?.includes(elem.id));
    }
    return items;
  }

  private async filterLearnedItems(group: number, page: number) {
    const ITEMS = [];
    let currentPage = page;
    while (currentPage >= 0 && ITEMS.length < this.maxItemsAmount) {
      const FILTRED = await this.getGameItems(currentPage--, group, true);
      ITEMS.push(...FILTRED!);
    }
    if (ITEMS.length > 20) return ITEMS.slice(0, 20);
    return ITEMS;
  }

  private async getDifficultyFiltredItems(diff: string) {
    const ITEMS = await filterWordService.getAggregatedWords(logInData.userId!, logInData.token!, `{"userWord.difficulty":"${diff}"}`, 3600);
    return ITEMS;
  }

  protected async updateUserWordInfo(wordId: string, status: boolean, word = '') {
    const TOKEN = logInData.token;
    const userId = logInData.userId;
    if (!logInData.isAutorizated || !TOKEN || !userId) return;
    const RESPONSE = await userWordsService.getUserWordByID({ userId, wordId }, TOKEN);
    //TODO AGREGATED API
    //TODO USERWORD KEY
    if (RESPONSE) {
      this.updateWordStats(RESPONSE, status, word);
      userWordsService.editUserWord(RESPONSE, TOKEN);
    } else {
      const DATA = this.createWordData(userId, wordId);
      this.updateWordStats(DATA, status, word);
      userWordsService.createUserWord(DATA, TOKEN);
    }
  }

  private createWordData(userId: string, wordId: string) {
    const DATA: INewWordRequest = {
      userId,
      wordId,
      word: {
        difficulty: 'normal',
        optional: {
          trueAnswer: 0,
          falseAnswer: 0,
        },
      },
    };
    return DATA;
  }

  private updateWordStats(data: INewWordRequest, status: boolean, word: string) {
    const KEY = 'learned';
    const STATISTIC_DATA: StatDateLearnedType = {
      word: word,
      add: status,
    };
    if (!data.word!.optional!.falseAnswer && !data.word!.optional!.trueAnswer) this.newWords++;
    if (status) {
      data.word!.optional!.trueAnswer += 1;
    } else {
      data.word!.optional!.falseAnswer += 1;
      if (data.word!.difficulty !== Difficulty.hard) data.word!.difficulty = Difficulty.normal;
      Statistics.updateStat(KEY, STATISTIC_DATA);
    }
    if (data.word!.optional!.trueAnswer >= 3 && data.word!.difficulty === Difficulty.normal) {
      data.word!.difficulty = Difficulty.easy;
      Statistics.updateStat(KEY, STATISTIC_DATA);
    }
    if (data.word!.optional!.trueAnswer >= 5 && data.word!.difficulty === Difficulty.hard) {
      Statistics.updateStat(KEY, STATISTIC_DATA);
      data.word!.difficulty = Difficulty.easy;
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
    const RESULTS_TABLE = document.createElement('table');
    const RETURN_BUTTON = document.createElement('button');
    const SCORE = document.createElement('p');
    RETURN_BUTTON.textContent = 'SOME BUTTON EVENT';
    if (score) {
      SCORE.textContent = `Вы заработали ${score} очков`;
    }
    this.results.forEach((result, index) => {
      const LINE = this.getResultLine(result, index);
      RESULTS_TABLE.append(LINE);
    });
    RESULTS_CONTAINER.append(SCORE, RESULTS_TABLE, RETURN_BUTTON);
    this.container.innerHTML = '';
    this.container.append(RESULTS_CONTAINER);
  }

  private getResultLine(result: boolean, index: number) {
    const LINE = document.createElement('tr');
    const sound = document.createElement('audio');
    sound.src = this.URL + this.itemsList![index].audio;
    const soundIcon = document.createElement('img');
    soundIcon.src = '../../assets/svg/sound.svg';
    soundIcon.addEventListener('click', () => sound.play());
    soundIcon.classList.add('game__sound-icon');
    const RESULT_ITEMS = [
      soundIcon,
      this.itemsList![index].word,
      this.itemsList![index].wordTranslate,
      this.itemsList![index].transcription,
      result ? '✔️' : '❌',
    ];
    RESULT_ITEMS.forEach((content) => {
      const TD = document.createElement('td');
      if (typeof content === 'string') TD.textContent = content;
      else TD.append(content);
      LINE.append(TD);
    });
    return LINE;
  }
}
