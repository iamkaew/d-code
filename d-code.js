players = new Mongo.Collection("players");

Router.route('/', function () {
  this.render('questioner');
});

Router.route('/player/:no', function () {
  if(players.findOne({_id:this.params.no})) {
    this.render('player');
  }
  else {
    this.render('register');
  }
});

if (Meteor.isClient) {
  // counter starts at 0
  // Session.setDefault('counter', 0);

  // Template.hello.helpers({
  //   counter: function () {
  //     return Session.get('counter');
  //   }
  // });
  Template.questioner.helpers({
    players: function() {
      return players;
    }
  });
  Template.questioner.events({
    'click button': function() {
      players = [];
    }
  });

  Template.player.helpers({
    player: function () {
      return players.findOne({_id:this.params.no}).name;
    }
  });

  // Template.hello.events({
  //   'click button': function () {
  //     // increment the counter when button is clicked
  //     Session.set('counter', Session.get('counter') + 1);
  //   }
  // });
  Template.register.events({
    'submit form': function (event) {
      var
      player = event.target.player.value;

      event.preventDefault();
      players.insert({_id:this.params.no, name: player, score: 0});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
