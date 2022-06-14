import { IWord } from './../../../services/WordsService';
('use strict');

import { Game } from '../Game';
import getRandomInt from '../../../common/getRandomInt';
import shuffle from '../../../common/shuffleArr';
import './challengePage.scss';
export class GameChallengePage extends Game {
  private challengeGameContainer: HTMLElement;

  private item: HTMLAudioElement;

  private itemTranslates: HTMLButtonElement[] = [];

  private randomWords: IWord[] | undefined;

  private maxTranslatesItem = 5;

  constructor(id: string, page?: number, group?: number, title = 'GameChallengePage') {
    super(id, title, 'challenge', page, group);
    this.challengeGameContainer = document.createElement('div');
    this.item = document.createElement('audio');
    for (let i = 0; i < this.maxTranslatesItem; i++) {
      this.itemTranslates.push(document.createElement('button'));
    }
    this.challengeGameContainer.classList.add('game__challenge-container');
    this.container.append(this.challengeGameContainer);
  }

  startGame(): void {
    this.renderItem();
  }

  private async renderItem() {
    const CONTAINER = document.createElement('div');
    const TRANSLATES_CONTAINER = document.createElement('div');
    const AUDIO_ICON = document.createElement('img');
    const HEADING = document.createElement('h2');
    HEADING.classList.add('challenge-game__heading');
    HEADING.textContent = 'Выберите правильный перевод';
    AUDIO_ICON.src = './assets/svg/sound.svg';
    AUDIO_ICON.classList.add('challenge-game__audio-icon');
    TRANSLATES_CONTAINER.classList.add('challenge-game__translates', 'multi-button');
    this.itemTranslates.forEach((elem) => TRANSLATES_CONTAINER.append(elem));
    CONTAINER.append(HEADING, AUDIO_ICON, TRANSLATES_CONTAINER);
    this.challengeGameContainer.append(CONTAINER, TRANSLATES_CONTAINER);
    AUDIO_ICON.addEventListener('click', () => this.item.play());
    this.setControlsListeners(TRANSLATES_CONTAINER);
    this.nextItem();
  }

  private async nextItem() {
    if (!this.itemsList) return;
    const GROUP = this.currentGroup || getRandomInt(0, 5);
    this.randomWords = await this.getGameItems(GROUP);
    const WORD_DATA = this.itemsList[this.currentItem];
    const ANSWERS = [WORD_DATA.wordTranslate];
    for (let i = 0; i < this.maxTranslatesItem - 1; i++) {
      const randomInt = getRandomInt(0, this.randomWords!.length - 1);
      const RANDOM_TRANSLATE = this.randomWords![randomInt].wordTranslate;
      if (!ANSWERS.includes(RANDOM_TRANSLATE)) ANSWERS.push(RANDOM_TRANSLATE);
      else i--;
    }
    shuffle(ANSWERS);
    ANSWERS.forEach((translate, index) => {
      this.itemTranslates[index].textContent = translate;
    });
    this.item.src = this.URL + WORD_DATA.audio;
    this.item.play();
  }

  private setControlsListeners(controls: HTMLElement) {
    controls.addEventListener('click', (e) => {
      if (!(e.target instanceof HTMLButtonElement)) return;
      const CURRENT_ITEM = this.itemsList![this.currentItem];
      const CORRECT_TRANSLATE = CURRENT_ITEM.wordTranslate;
      const ID = CURRENT_ITEM.id || CURRENT_ITEM._id;
      let status = true;
      if (e.target.textContent === CORRECT_TRANSLATE) this.correctAnswer();
      else {
        this.incorrectAnswer();
        status = false;
      }
      this.updateUserWordInfo(ID!, status, CURRENT_ITEM.word);
      this.currentItem++;
      if (this.currentItem === this.itemsList?.length) {
        this.ResultItems?.push(...this.itemsList);
        this.renderResults();
        return;
      }
      this.nextItem();
    });
  }

  private correctAnswer() {
    this.playSound(true);
    this.results.push(true);
    this.sequence++;
    if (this.sequence > this.bestSequence) this.bestSequence = this.sequence;
  }

  private incorrectAnswer() {
    this.playSound(false);
    this.sequence = 0;
    this.results.push(false);
  }
}
