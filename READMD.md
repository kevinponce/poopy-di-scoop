<nav>
  <ul>
    <li><a href="{page.Home.url}">{page.Home.title}</a></li>
    <li><a href="/about">about</a></li>
  </ul>
</nav>



<nav>
  <ul>
    <li each="link in [page.Home, page.About, page.Videos]"><a href="{link.url}">{link.title}</a></li>
  </ul>
</nav>



<var name="links" value="[page.Home, page.About, page.Videos]"/>
<nav>
  <ul>
    <li each="link in links"><a href="{link.url}">{link.title}</a></li>
  </ul>
</nav>




<style scoped></stye>

<link rel="stylesheet" href="styles.css" scoped head>

<link rel="stylesheet" href="styles.css" scoped head embed>

<link rel="stylesheet" href="styles.css" scoped inline>

<script type="text/javascript" eof>
  console.log('hi');
</script>

<script type="text/javascript" src="filename.js" ></script>





change template to site or project


might need to readd safe eval to add scope to parse html for [page.Home, page.About, page.Videos]


loadTemplate


TODO @ like vuejs

add  checksum https://www.online-tech-tips.com/cool-websites/what-is-checksum/
to determin if needs to be updated on github pages or s3

if statement

option to load from dir or db



folder structure:
templates
components
components/nav/index.html

components/home/index.html
components/home/home.scss
components/home/home.js

components/blogs/index.html
components/blogs/blogs.scss
components/blogs/blogs.js

components/blog/index.html
components/blog/blog.scss
components/blog/blog.js


data
data/home
  {
    params: {
      meta: {
        title: 'Home',
        description: 'Welcome'
      },
      header: 'Welcome to',
      videos: [{
        title: 'Hello',
        date: '',
        url: ''
      }]
    },
    component: 'home',
    url: '/',
    name: 'Home',
    title: 'home'
  }




projects
poopy-di-scoop
poopy-di-scoop-cli
poopy-di-scoop-app


poopy-di-scoop-api
# where you can do search, forms, subscribe, signin, purchase items








change all assertions to use chai instead of mocha



figure out how to use who lib in an actual project....



use sass to namespace scss files
import sass from 'node-sass';

example:
var result = sass.renderSync({
  data: '.test { .me { color: #ff0000; } }'
});





