var express = require('express');
var async = require('async');
var fs = require('fs');
var _ = require('underscore');

var router = express.Router();

var data = {
    trainings: loadData('trainings'),
    themes: loadData('themes'),
    qualities: loadData('qualities'),
    animals: loadData('animals'),
    monsters: loadData('monsters'),
    plants: loadData('plants'),
    race: loadData('race')
};

function getCharacter(req, res, next){
    var firstTraining = pick(_.keys(data.trainings));
    var secondTraining = weightedPick(data.trainings[firstTraining]);
    var firstTheme = pick(_.keys(data.themes));
    var secondTheme = pick(_.keys(data.themes), firstTheme);
    var themes = [firstTheme, secondTheme];
    var race = getRace();

    requireDark = false;

    _.each(themes, function(theme){
        if (_.has(data.themes[theme], "darkQuality") && data.themes[theme].darkQuality){
            requireDark = true;
        }
        if (_.has(data.themes[theme], "racialModifier") && data.themes[theme].racialModifier){
            race = theme + ': ' + race;
        }
    });

    var qualities = getQualities(requireDark);

    var doc = {
        race: race,
        training: prettyPrintTraining(firstTraining, secondTraining),
        themes: [ firstTheme, secondTheme],
        qualities: qualities
    }
    console.log(JSON.stringify(doc, null, 2));
    res.render('index', { title: 'Crossover Character Generator', data:doc });
}

var router = express.Router();
router.get('/', getCharacter);

module.exports = router;

function prettyPrintTraining(training1, training2){
    if (training1 === training2){
        return "Journeyman " + training1;
    } else {
        return training1 + ' / ' + training2;
    }
}

function getQualities (requireDark){
    var qualityDistro;
    do {
        qualityDistro = weightedPick(data.qualities.Ratios);
    } while (requireDark === true && qualityDistro.Dark === 0);

    var qualities = [];
    for (var i = 0; i < qualityDistro.Heroic; i++){
        qualities.push(pick(data.qualities.Heroic, qualities));
    }
    for (var i = 0; i < qualityDistro.Dark; i++){
        qualities.push(pick(data.qualities.Dark, qualities) + ' (Dark)');
    }
    return qualities;
}

function getRace(){
    var race = weightedPick(data.race);
    switch(race){
        case 'Talking Animal':
            race += ': ' + capitalizeFirstLetter(pick(data.animals.animals));
            break;
        case 'Monster':
            race = capitalizeFirstLetter(pick(data.monsters.names));
            break;
        case 'Talking Plant':
            race += ': ' + capitalizeFirstLetter(pick(data.plants.flowers));
            break;
        default:
    }
    return race;
}

function loadData(name){
    var file = fs.readFileSync('./data/' + name + '.json');

    var data = null;
    try {
        data = JSON.parse(file);
    }
    catch(e){
        console.log('Failed loading ' + name + '.json: '+ e);
        process.exit(1);
    }
    return data;
}

function pick(list, value){
    if (typeof(value) === 'undefined'){
        value = "";
    }
    var choice = "";
    if (Array.isArray(value)){
        do {
            choice = list[Math.floor(Math.random()*list.length)];
        }
        while ( Array.isArray(value) && _.indexOf(value, choice) !== -1);
    } else {
        do {
            choice = list[Math.floor(Math.random()*list.length)];
        }
        while (choice === value);
    }
    return choice;
}

function weightedPick(list){
    var val = Math.floor(Math.random() * 100)+1;
    var keys = _.keys(list);
    keys = keys.map(function(e) { return Number(e)})
    for (var i = 0; i < keys.length; i++){
        if (Number(keys[i]) >= val){
            return list[keys[i]];
        }
    }
    return null;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

