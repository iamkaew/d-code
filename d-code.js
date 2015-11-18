questions = new Mongo.Collection('questions');
players = new Mongo.Collection('players');
code = new Mongo.Collection('code');
resv_ids = [];
q_size = 4;
config = {
  'full score': 3,
  'max player': 3,
  'resv size' : 2
};

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
  var
  showQuestion = function() {
    var
    _id, question;

    do {
      _id = Math.round(Math.random() * q_size);
    } while(resv_ids.indexOf(_id) > -1);
    if(resv_ids.length == config['resv size']) {
      resv_ids.shift();
    }
    resv_ids.push(_id);
    question = questions.findOne(_id);
    Session.set('ask', question.ask);
    code.update({_id: 'dummy'}, {$set: {code: question.ans, solved: false}}, {upsert: true});
  };

  Session.setDefault('wait', true);
  Template.players.helpers({
    players: function() {
      return players.find({}, {sort: {score: -1}});
    }
  });

  Template.go.helpers({
    question: function() {
      return Session.get('ask');
    }
  });
  
  Template.questioner.helpers({
    wait: function() {
      return Session.get('wait');
    }
  });

  Template.questioner.events({
    'click #reset': function() {
      Meteor.call('resetPlayers')
      Session.set('wait', true);
    }
  });

  Template.go.events({
    'click #next': function() {
      showQuestion();
    }
  });

  Template.stop.events({
    'click #start': function() {
      Session.set('wait', false);
      showQuestion();
    }
  });

  document.onkeydown = function (e) {
    return (e.which || e.keyCode) != 116;
  };

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
      player_name = event.target.player.value,
      _id;

      event.preventDefault();
      if(players.findOne({name: player_name})) {
        Session.set('err', 'มีผู้เล่นชื่อนี้แล้ว');
      }
      else {
        _id = players.insert({name: player_name, score: 0});
        Session.set('player', players.findOne(_id).name);
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
        var
        solution = code.findOne({});

        if(solution.solved) {

        }
        else if(_code == solution.code) {
          code.update({_id: 'dummy'}, {$set: {solved: true}});
          players.update({name: _name}, {$inc: {score: 1}});
        }
        else {

        }
      }
    });
  });
}

/*
db.questions.insert([
  {_id: 0, ask: 'แก้วแรดสามฤดู', ans: '3000'},
  {_id: 1, ask: 'พระจันทร์ตั้งโด่เด่', ans: '3002'},
  {_id: 2, ask: 'เปาบุ้นจิ้น', ans: '1200'},
  {_id: 3, ask: 'บนฟ้าเป็ดร้องอู๊ด', ans: '2827'},
  {_id: 4, ask: 'กลับหัวขายไม่เอาอังกฤษ', ans: '7735'}
]);
*/