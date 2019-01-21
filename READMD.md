# Poopy di scoop
Is a component based static website builder!

# Getting Started
npm i poopy-di-scoop

```javascript
var poopDiScoop = require('poopy-di-scoop').default;

var pds = new poopDiScoop({
  rootDir: './',
  githubName: 'blog' // optinal and is used for deploying to github
});

pds.load(); // by default will push to prod if it is configured correctly above
pds.load(false); // build without pushing to prod.

pds.pushToProd(); // you can push to prod manually
```

# Folder Structure
## components
Components are segments of html that are compiled into creating a static website. They get there name from their folder struture.
Example:
components/home/index.html: home
components/blog/post.html: blog-post

## html
Is a compiled directory that is used for prod.

## local
Is a compiled directory that enables you to test locally.

## pages
Pages are used to pass data into a component and generate html in html and local directory.
```javascript
{
  "name": "home",
  "url": "/",
  "component": "home",
  "params": {
    "hello": "kevin was here!"
  }
}
```

# Component Examples
## Params
a params can be print by adding {} around param key
```html
<div>{ example }</div>
<div class="{ example }">{ example }</div>
<a href="{ link.href }">{ link.title }</a>
```
## Each
```html
<ul>
  <li each="num in [1, 2, 3]">{num}</li>
</ul>
<ul>
  <li each="link in links">
    <a href="{ link.href }">{ link.title }</a>
  </li>
</ul>
```

## Include Component
my-nav/index.html
```html
<ul>
  <li each="link in links">
    <a href="{ link.href }">{ link.title }</a>
  </li>
</ul>
```

home/index.html
```html
<html>
  <body>
    <my-nav />
    <h2>Hello World</h2>
  </body>
</html>
```

## Children
layout/index.html
```html
<html>
  <body>{children}</body>
</html>
```

home/index.html
```html
<layout>
  <h2>Hello World</h2>
</layout>
```

## Default Params
default params can only have one options and it will run eval on the default value only if params is not found
```html
<div>{ test || 'example' }</div>
```

## Param render html used to render components
```html
<div raw-html>{ test }</div>
```

## Don't render param so it will skip params within tag
```html
<div raw>{ test }</div>
```

## Including CSS
Href will use the relative path and if it is found, it will embed it.
If you would like to compress the css, add attr compressed.
If you would like to namespace css, add attr scoped or namespaced.
Sometimes a component will be included multiple times and if you want the css to only be included once add attr once.
```html
<link href="blogCard.scss" type="text/css" compressed/>
<link href="blogCard.scss" type="text/css" scoped/>
<link href="blogCard.scss" type="text/css" namespaced/>
<link href="blogCard.scss" type="text/css" once/>
```

## Including Js
Href will use the relative path and if it is found, it will embed it.
If you would like to compress the css, add attr compressed.
Sometimes a component will be included multiple times and if you want the js to only be included once add attr once.
```html
<script type="text/javascript" src="mode/python.js" compressed></script>
<script type="text/javascript" src="mode/python.js" once></script>
```

# CMS
## Param Type
text, html, number are support type. Do the following to get it work with the CMS
```html
<div>{ test:text }</div>
<div>{ test:html }</div>
<div>{ test:number }</div>
```

# Roadmap
## Push to s3...

## if statement

## inline css
```html
<link rel="stylesheet" href="styles.css" inline>
```
## build without deploy
## deploy with out build
## form submit
## subscribe to blog
## search
## signin
## store
