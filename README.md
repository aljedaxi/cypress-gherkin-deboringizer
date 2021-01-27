# has this ever happened 2 u?
you're using [cypress & gherkin](https://github.com/TheBrainFamily/cypress-cucumber-preprocessor)

# how 2 run
```sh
export OUTDIR=theDirectoryYouWantTheStuffWrittenTo; node index.js $pathToGherkinAsPlaintext
```

it'll create a folder called `$theDirectoryYouWantTheStuffWrittenTo/$fileName` a file called `$theDirectoryYouWantTheStuffWrittenTo/$fileName.feature`, and a file called `$theDirectoryYouWantTheStuffWrittenTo/steps.js`.
