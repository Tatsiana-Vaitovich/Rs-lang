import { Component } from '../../../core/templates/components';
import { Card } from '../../../common/card';
import { CardType } from '../../../common/card/types';
import './appDescription.scss';
import { PageIds } from '../../../app';

const cardsContent: CardType[] = [
  {
    img: './assets/images/1.png',
    text:
      'Изучай новые слова от простого к сложному! Ты можешь пометить сложные слова и удалить слово из раздела как изученное! Выучил все слова в разделе? Переходи к следующему!',
    caption: 'Учебник',
    href: PageIds.elBookPage,
  },
  {
    img: './assets/images/2.png',
    text: 'Учебник содержит 3600 часто встречающихся слов. Слушай, читай, учи их в своем темпе!',
    caption: 'Список слов',
    href: PageIds.elBookPage,
  },
  {
    img: './assets/images/7.png',
    text: 'Скучно просто повторять слова по учебнику? Переходи в раздел Игры!',
    caption: 'Игры',
    href: PageIds.games,
  },
  {
    img: './assets/images/5.png',
    text: 'Регистрируйся и получай подробную статистику своих достижений!',
    caption: 'Статистика',
    href: PageIds.statisticsPage,
  },
];

export class AppDescription extends Component {
  constructor(tagName: string, className: string[]) {
    super(tagName, className);
    this.container.classList.add('appDescription');
    this.container.innerHTML = '<h3 class="visually-hidden>Application description</h3>';
  }

  render(isRegisted: boolean) {
    cardsContent.forEach((el) => {
      const card = new Card(el).render() as HTMLLinkElement;
      card.classList.add(`card--${el.href}`);
      this.container.append(card);
    });
    if (!isRegisted) {
      const statisticsCard = this.container.querySelector(`.card--${PageIds.statisticsPage}`) as HTMLElement;
      statisticsCard.style.cursor = 'auto';
      statisticsCard.addEventListener('click', (e: Event) => {
        e.preventDefault();
      });
    }
    return this.container;
  }
}
