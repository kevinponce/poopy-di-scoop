# Poopy di scoop
Is a component based static website builder

# Examples

# Roadmap
## default
```html
<div>{ hello | 'world' }</div>
```

## 
example/index
<example />

## Layout
```html
<yield name="javascripts"/>
<yield name="style"/>


<link rel="stylesheet" href="./styles.css" scoped yield-to="style">
<script type="text/javascript" src="filename.js" yield-to="javascripts"></script>
````

## Push to github or s3...

## if statement

## inline css
```html
<link rel="stylesheet" href="styles.css" inline>
```

## include
```html
{ inlclude header }
```

## render css/js once

## var
```html
<var name="links" value="[1, 2, 3]"/>
```

## form submit
## subscribe to blog
## search
## signin
## store

# issues
## html comments fail...
# nested scoped fails...
