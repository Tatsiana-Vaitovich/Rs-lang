import { Page } from '../../core/templates/page';
import { Card } from '../../common/card';
import { PageIds } from '../../app';
import { CardType } from '../../common/card/types';
import './gamesPage.scss';

export class GamesPage extends Page {
  static TextObject = {
    MainTitle: 'GamesPage',
  };

  private Games: CardType[] = [
    {
      caption: 'Аудиовызов',
      text: 'Развиваем словарный запас! Выберите правильный перевод услышанного слова.',
      href: PageIds.gameChallengePage,
      img: './assets/images/2.png',
    },
    {
      caption: 'Спринт',
      text: 'Тренируем навык быстрого перевода с английского языка на русский! Выберите соответсвует ли перевод предложенному слову.',
      href: PageIds.gameSprintPage,
      img: './assets/images/2.png',
    },
  ];

  constructor(id: string) {
    super(id);
  }

  private renderGamesCards() {
    const cards = document.createElement('div');
    cards.classList.add('games');
    this.Games.forEach((el) => {
      const card = new Card(el).render();
      card.classList.add('games__item');
      cards.append(card);
    });
    return cards;
  }

  private renderCaption() {
    const caption = document.createElement('p');
    caption.classList.add('games__caption');
    caption.textContent = 'Выбирай и начинай учить английский играючи!';
    return caption;
  }

  render() {
    const title = this.createHeaderTitle(GamesPage.TextObject.MainTitle);
    title.classList.add('visually-hidden');
    this.container.append(title);
    this.container.append(this.renderCaption());
    this.container.append(this.renderGamesCards());
    return this.container;
  }
}
