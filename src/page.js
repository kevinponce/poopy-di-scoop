import url from 'url';

export default class Page {
  constructor({ name, url, title, component, params }) {
    this.name = name;
    this.url = url;
    this.title = title;
    this.component = component;
    this.params = params;

    this.isValid();
  }

  isValid () {
    if (!this.component) {
      throw new Error(`invalid page component required in ${this.name}`)
    }
    if (!this.url) {
      throw new Error(`invalid page url required in ${this.name}`)
    }

    if (!this.title) {
      throw new Error(`invalid page title required in ${this.name}`)
    }

    let uri = url.parse(this.url);
    if (uri.hostname) {
      throw new Error(`${this.name} url must be relative`)
    }

    return true;
  }

  toJson () {
    return {
      "name": this.name,
      "title": this.title,
      "url": this.url
    }
  }
}
