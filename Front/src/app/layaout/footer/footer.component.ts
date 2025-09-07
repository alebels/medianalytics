import { CONTACT_EMAIL, GITHUB_REPO, X_ACCOUNT } from '../../utils/constants';
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  githubLink = GITHUB_REPO;
  contactEmail = CONTACT_EMAIL;
  projectVersion = environment.projectVersion;
  xAccount = X_ACCOUNT;
}
