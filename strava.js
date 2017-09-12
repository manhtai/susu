// Credit: https://github.com/pifantastic/fitbot
// Customized for susu by @manhtai

const util    = require('util');
const strava  = require('strava-v3');
const _       = require('lodash');
const request = require('request');
const cool    = require('cool-ascii-faces');

const config   = require('./const');

const VERBS = {
  'Ride': 'đạp xe',
  'Run': 'chạy',
  'Swim': 'bơi',
};

const EMOJI = {
  'Ride': ':bike:',
  'Run': ':runner:',
  'Swim': ':swimmer:',
};


function isValidActivity(activity) {
  // Filter out activities that are more than 2 days old.
  const TWO_DAYS = 1000 * 60 * 60 * 24 * 2;
  const isStale = (new Date(activity.start_date).getTime()) <= (new Date().getTime() - TWO_DAYS);

  // Filter out bike commutes.
  const isBikeCommute = activity.type === 'Bike' && activity.commute;
  return !isStale && !isBikeCommute;
}


function checkForNewActivities(controller, initial) {
  initial = !!initial

  config.STRAVA_CLUBS.split(',').forEach(function(clubId) {
    strava.clubs.listActivities({
      access_token: config.STRAVA_TOKEN,
      per_page: 200,
      id: clubId,
    }, function(error, activities) {
      if (error) {
        return console.error('Error listing activities', {error: error, club: clubId});
      }

      if (!activities || !activities.length) {
        return console.info('No activities found', {response: activities, club: clubId});
      }

      console.info('Checked for activities', {
        count: activities.length,
        club: clubId,
        initial: initial
      });

      // On the initial pass we just want to populate the database but not post
      // any activities. This makes it safe to start fitbot without bombing a
      // channel with messages.
      activities.forEach((activity) => {
        controller.storage.channels.get(activity.id, (err, acc) => {
          if (err) return console.error('Error getting activity from db', err);

          if (!acc && isValidActivity(activity)) {
            controller.storage.channels.save(activity, (err) => {
              if (err) return console.log('Error saving activity to db', err);

              if (!initial) {
                strava.activities.get({
                  access_token: config.STRAVA_TOKEN,
                  id: activity.id
                }, (err, detail) => {
                  if (err) return console.error('Error fetching activity details from strava', err);

                  postActivityToSlack(config.STRAVA_SLACK_WEBHOOK, activity.athlete, detail);
                });
              }
            });
          }
        });
      });
    });
  });
};


function postActivityToSlack(webhook, athlete, activity) {
  var message = formatActivity(athlete, activity);

  request.post({
    url: webhook,
    method: 'POST',
    json: true,
    body: {
      username: config.SLACK_NAME,
      text: message
    },
  }, function(error) {
    if (error) {
      return console.error('Error posting message to Slack', {
        error: error,
        activity: activity,
      });
    }

    console.info(util.format('Posted to slack: %s', message));
  });
}


function formatActivity(athlete, activity) {
  const emoji = EMOJI[activity.type];
  const who = util.format('%s %s', athlete.firstname, athlete.lastname);
  const link = util.format('<https://www.strava.com/activities/%d>', activity.id);
  const distance = Math.round(activity.distance / 10) / 100;
  const verb = VERBS[activity.type] || activity.type;

  return `${who} vừa ${verb} ${distance} km về! ${cool()}\n ${emoji} ${activity.name} ${link}`;
}


module.exports = (controller) => {
  // Use tick as clock
  controller.on('tick', () => {
    controller.storage.teams.get('strava_meta', (err, data) => {
      if (err) return console.log('Error when check time', err);
      if (!data) {
        data = {
          id: 'strava_meta',
          initial: true,
          last_check_time: new Date()
        }
        controller.storage.teams.save(data, (err) => {
            if (err) console.log('Error when saving last check time', err);
            console.log('Save last time check to db!');
            checkForNewActivities(controller, true);
        });
      } else {
        if (data.last_check_time.getTime() < new Date().getTime() - config.STRAVA_CHECK_INTERVAL) {
          data.last_check_time = new Date();
          data.initial = false;
          controller.storage.teams.save(data, (err) => {
            if (err) return console.log('Error when saving last check time', err);
            checkForNewActivities(controller);
          });
        }
      }
    })
  });
}
