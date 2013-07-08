var LOCALES = require('../translations/locales');
var en = require('../dist/en.js');

// Set locale as global variable
window.locale.en = en;
window.locale.current('en');
window.app = {};

var $ = require('jquery-browserify');
var _ = require('underscore');
var Backbone = require('backbone');
var Router = require('./Router');
var User = require('./models/user');
var NotificationView = require('./views/notification');
var config = require('./config');
var cookie = require('./cookie');
var auth = require('./config');

// Set up translations
var setLanguage = (cookie.get('lang')) ? true : false;

// Check if the browsers language is supported
if (setLanguage) app.locale = cookie.get('lang');

if (app.locale && app.locale !== 'en') {
    $.getJSON('./translations/locales/' + app.locale + '.json', function(result) {
        window.locale[app.locale] = result;
        window.locale.current(app.locale);
    });
}

var user = new User();

user.authenticate({
  success: function() {
    if ('withCredentials' in new XMLHttpRequest()) {
      // Set OAuth header for all CORS requests
      $.ajaxSetup({
        headers: {
          'Authorization': config.auth === 'oauth' ? 
            'token ' + cookie.get('oauth-token') :
            'Basic ' + Base64.encode(config.username + ':' + config.password)
        }
      });

      // Set User model id and login from cookies
      var id = cookie.get('id');
      if (id) user.set('id', id);

      var login = cookie.get('login');
      if (login) user.set('login', login);

      user.fetch({
        success: function(model, res, options) {
          // Set authenticated user id and login cookies
          cookie.set('id', user.get('id'));
          cookie.set('login', user.get('login'));

          // Initialize router
          window.router = new Router({ user: model });

          // Start responding to routes
          Backbone.history.start();
        },
        error: function(model, res, options) {

          var link = auth.site + '/login/oauth/authorize?client_id=' + auth.id + '&scope=repo,user&redirect_uri' + encodeURIComponent(window.location.href);

          var view = new NotificationView({
            'message': t('notification.error.github'),
            'action': 'Login',
            'link': link
          }).render();

          $('#prose').html(view.el);
        }
      });
    } else {
      // TODO: emit notification event
      // Display an upgrade notice.
      var tmpl = _.template(templates.upgrade);
      $('#prose').html(tmpl);
    }
  },
  error: function() {
    // Initialize router
    window.router = new Router();

    // Start responding to routes
    Backbone.history.start();
  }
});