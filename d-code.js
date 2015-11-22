questions = new Mongo.Collection('questions');
players = new Mongo.Collection('players');

Router.route('/', function () {
  this.render('questioner');
});

Router.route('/player', function () {
  if(Session.get('player')) {
    this.render('player');
  }
  else {
    this.render('register');
  }
});

if(Meteor.isClient) {
  // ส่วนควบคุมการแสดงคำถาม
  var
  max_player = 4,
  resv_size = 10,
  resv_ids = [],
  showQuestion = function() {
    var
    _id, question;

    do {
      _id = Math.round(Math.random() * (questions.find({}).count() - 1)) + 1;
    } while(resv_ids.indexOf(_id) > -1);
    if(resv_ids.length == resv_size) {
      resv_ids.shift();
    }
    resv_ids.push(_id);
    question = questions.findOne(_id);
    Session.set('ask', question.ask);
    Session.set('qno', _id);
    Meteor.call('setSolution', question.ans);
  };

  Session.setDefault('wait', true);
  Template.questioner.helpers({
    wait: function() {
      return Session.get('wait');
    },
    question: function() {
      return Session.get('ask');
    },
    players: function() {
      return players.find({}, {sort: {score: -1}});
    },
    qno: function() {
      return Session.get('qno');
    }
  });
  Template.questioner.events({
    'click #start': function() {
      Session.set('wait', false);
      showQuestion();
    },
    'click #next': function() {
      showQuestion();
    },
    'click #reset': function() {
      Meteor.call('resetPlayers')
      Session.set('wait', true);
    }
  });

  // ส่วนการถอดรหัส
  Template.player.helpers({
    player: function () {
      if(players.find({}).count() == 0) {
        Session.set('player', null);
      }
      else if(players.findOne({name: Session.get('player')}).init) {
        Session.set('result', '');
        Session.set('blink', '');
      }
      return Session.get('player');
    },
    result: function() {
      return Session.get('result');
    },
    blink: function() {
      return Session.get('blink');
    }
  });
  Template.player.events({
    'submit form': function (event) {
      event.preventDefault();
      Meteor.call('checkCode', Session.get('player'), event.target.ans.value, function(err, result) {
        event.target.ans.value = '';
        if(result == 0) {
          Session.set('result', 'ช้าไปนิส.. เค้าตอบไปแล้ว');
        }
        else if(result == 1) {
          Session.set('result', 'ถูกต้องแล้วคร๊าบ');
          Session.set('blink', 'blink');
        }
        else {
          Session.set('result', 'ยังไม่ถูก ลองอีกที');
        }
      });
    }
  });
  Template.player.rendered = function() {
    this.find('input').focus();
  }

  // ส่วนลงชื่อผู้เล่น
  Template.register.helpers({
    error: function() {
      return Session.get('error');
    }
  });
  Template.register.events({
    'submit form': function (event) {
      var
      player_name = event.target.player.value,
      _id;

      event.preventDefault();
      if(players.find({}).count() == max_player) {
        Session.set('error', 'ผู้เล่นครบแล้ว');
      }
      else if(players.findOne({name: player_name})) {
        Session.set('error', 'มีผู้เล่นชื่อนี้แล้ว');
      }
      else {
        _id = players.insert({name: player_name, score: 0});
        Session.set('player', players.findOne(_id).name);
        Session.set('result', '');
        Session.set('error', '');
      }
    }
  });
  Template.register.rendered = function() {
    this.find('input').focus();
  }

  document.onkeydown = function (e) {
    return (e.which || e.keyCode) != 116;
  };
}

if (Meteor.isServer) {
  var
  code = '',
  solved = false;

  Meteor.startup(function () {
    return Meteor.methods({
      resetPlayers: function() {
        return players.remove({});
      },
      checkCode: function(_name, _code) {
        if(solved) {
          return 0;
        }
        else if(_code == code) {
          solved = true;
          players.update({}, {$set: {status: '', init: false}});
          players.update({name: _name}, {$inc: {score: 1}, $set: {status: 'solver'}});
          return 1;
        }
        else {
          return 2;
        }
      },
      setSolution: function(_code) {
        code = _code;
        solved = false;
        players.update({}, {$set: {status: '', init: true}});
      }
    });
  });
}