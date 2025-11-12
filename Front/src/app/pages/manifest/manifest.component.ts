import { CONTACT_EMAIL, GITHUB_REPO, X_ACCOUNT } from '../../utils/constants';
import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-manifest',
  imports: [TranslatePipe],
  templateUrl: './manifest.component.html',
  styleUrl: './manifest.component.css',
})
export class ManifestComponent {
  contactEmail = CONTACT_EMAIL;
  githubLink = GITHUB_REPO;
  xAccount = X_ACCOUNT
}
