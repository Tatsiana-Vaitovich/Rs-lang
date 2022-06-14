import { App, PageIds } from '../../../app';
import { Component } from '../../../core/templates/components';
import { RSLangLS } from '../../../RSLangLS';
import { logInData } from '../../../states/logInData';
import { Button } from '../../button';
import './userView.scss';

export class UserView extends Component {
  private buttonExit: Button;

  private buttonInput: HTMLLinkElement;

  constructor() {
    super('div', ['userView']);
    this.container.innerHTML =
      '<div class="userView__wrap"><img src="./assets/svg/user-icon.svg" class="userView__img"></div><p class="userView__greeting">User</p>';
    this.buttonExit = new Button('button', 'Выход', ['userView__btn', 'userView__btn--exit']);
    this.buttonExit.onClick(this.signOut);
    this.buttonInput = new Button('a', 'Вход', ['userView__btn', 'userView__btn--input']).rendor() as HTMLLinkElement;
    this.buttonInput.href = `#${PageIds.autorizationPage}`;
  }

  private signOut() {
    RSLangLS.removeUserData();
    const app = new App();
    app.runToMainPage();
  }

  private hideBtn(btn: HTMLElement) {
    btn.style.display = 'none';
  }

  private showGreeting(greeting: HTMLElement) {
    const message = logInData.name;
    if (message) {
      greeting.textContent = `Привет, ${message}!`;
    }
  }

  render() {
    const wrap = this.container.querySelector('.userView__wrap') as HTMLElement;
    wrap.append(this.buttonInput);
    wrap.append(this.buttonExit.rendor());
    const greeting = this.container.querySelector('.userView__greeting') as HTMLElement;
    if (logInData.isAutorizated) {
      this.hideBtn(this.buttonInput);
      this.showGreeting(greeting);
    } else {
      const exitBtn = this.container.querySelector('.userView__btn--exit') as HTMLElement;
      this.hideBtn(exitBtn);
      greeting.style.display = 'none';
    }
    return this.container;
  }
}
