players = new Mongo.Collection('players');
questions = new Mongo.Collection('ques_set');
code = 0;

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

if (Meteor.isClient) {
  Session.setDefault('q_idx', Math.round(Math.random() * 3) + 1);
  prepare = function() {
    ques_set.forEach(function(set) {
      set.sort(function(a, b) {
        return Math.random() < 0.5 ? 1 : -1;
      });
    });
  };

  document.onkeydown = function (e) {
    return (e.which || e.keyCode) != 116;
  };

  Tracker.autorun(function() {
    if(players.find({}).count() == 0) {
      Session.set('player', null);
    }
  });
  
  Template.questioner.helpers({
    players: function() {
      return players.find({}, {sort: {score: -1}});
    },
    question: function() {
      // ques_set = questions.find({}).fetch();
      // prepare();
      // Session.set('question', ques_set[s_idx][q_idx++]);
      Session.set('question', questions.findOne(Session.get('q_idx')));
      code = Session.get('question').ans;
      return Session.get('question').ask;
    }
  });

  Template.questioner.events({
    'click #reset': function() {
      Meteor.call('resetPlayers')
    },
    'click #next': function() {
      Session.set('q_idx', Math.round(Math.random() * 3) + 1);
    }
  });

  Template.player.helpers({
    player: function () {
      if(players.find({}).count() == 0) {
        Session.set('player', null);
      }
      return Session.get('player');
    }
  });

  Template.player.events({
    'submit form': function (event) {
      event.preventDefault();
      Meteor.call('checkCode', Session.get('player'), event.target.ans.value);
    }
  });

  Template.register.events({
    'submit form': function (event) {
      var
      player = players.findOne({name: Session.get('player')}),
      player_name = event.target.player.value,
      _id;

      event.preventDefault();
      if(player) {
        Session.set('err', 'มีผู้เล่นชื่อนี้แล้ว');
      }
      else {
        _id = players.insert({name: player_name, score: 0});
        player = players.findOne(_id);
        Session.set('player', player.name);
      }
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    return Meteor.methods({
      resetPlayers: function() {
        return players.remove({});
      },
      checkCode: function(_name, _code) {
        if(_code == '7735') {
          players.update({name: _name}, {$inc: {score: 1}});
        }
      }
    });
  });
}

/*
db.ques_set.insert([
  {_id: 1, ask: 'พระจันทร์ตั้งโด่เด่', ans: '3002'},
  {_id: 2, ask: 'เปาบุ้นจิ้น', ans: '1200'},
  {_id: 3, ask: 'บนฟ้าเป็ดร้องอู๊ด', ans: '2827'},
  {_id: 4, ask: 'กลับหัวขายไม่เอาอังกฤษ', ans: '7735'}
]);
*/