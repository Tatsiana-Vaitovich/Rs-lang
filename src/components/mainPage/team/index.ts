import { Component } from '../../../core/templates/components';
import { TeamMemberCard } from './teamMember/teamMemberCard';
import { TeamMemberData } from './teamMember/types';
import './team.scss';

export const teamMembersData: TeamMemberData[] = [
  {
    img: './assets/images/team1.jpg',
    name: 'Татьяна Болтрушевич',
    position: 'Team Lead',
    role: 'Реализация главной страницы, страницы авторизации, страницы статистики',
    gitHub: 'https://github.com/Tatsiana-Vaitovich',
    nicName: 'Tatsiana-vaitovich',
  },
  {
    img: './assets/images/team2.jpg',
    name: 'Богдан Палянца',
    position: 'Разработчик',
    role: 'Реализация игр "Спринт" и "Аудиовызов"',
    gitHub: 'https://github.com/whispermind',
    nicName: 'Whispermind',
  },
  {
    img: './assets/images/team3.jpg',
    name: 'Елена Рыжанкова',
    position: 'Разработчик',
    role: 'BackEnd, реализация электронного учебника, реализация списка слов',
    gitHub: 'https://github.com/lena-r-a',
    nicName: 'Lena_r_a',
  },
];

export class Team extends Component {
  constructor(tagName: string, className: string[]) {
    super(tagName, className);
    this.container.classList.add('team');
  }

  render() {
    teamMembersData.forEach((el) => {
      const card = new TeamMemberCard(['team__member'], el).render();
      this.container.append(card);
    });
    return this.container;
  }
}
