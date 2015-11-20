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
  var
  config = {
    'max player': 3,
    'resv size' : 10
  },
  resv_ids = [],
  showQuestion = function() {
    var
    _id, question;

    do {
      _id = Math.round(Math.random() * (questions.find({}).count() - 1)) + 1;
    } while(resv_ids.indexOf(_id) > -1);
    if(resv_ids.length == config['resv size']) {
      resv_ids.shift();
    }
    resv_ids.push(_id);
    question = questions.findOne(_id);
    Session.set('ask', question.ask);
    Meteor.call('setSolution', question.ans);
  };

  // ส่วนควบคุมการแสดงคำถาม
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
    solved: function() {
      return Session.get('solved');
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
      }
      return Session.get('player');
    },
    result: function() {
      return Session.get('result');
    }
  });
  Template.player.events({
    'submit form': function (event) {
      event.preventDefault();
      Meteor.call('checkCode', Session.get('player'), event.target.ans.value, function(err, result) {
        event.target.ans.value = '';
        Session.set('result', result);
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
      if(players.find({}).count() == config['max player']) {
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
          return 'Solved';
        }
        else if(_code == code) {
          solved = true;
          players.update({}, {$set: {status: '', init: false}});
          players.update({name: _name}, {$inc: {score: 1}, $set: {status: 'solver'}});
          return 'Correct';
        }
        else {
          return 'Try again';
        }
      },
      setSolution: function(_code) {
        code = _code;
        solved = false;
        players.update({}, {$set: {init: true}});
      }
    });
  });
}

/*
db.questions.insert([
  {_id: 1, ask: 'โสมฝรั่งตั้งโด่เด่', ans: '3002'},
  {_id: 2, ask: 'เปาบุ้นจิ้น', ans: '1200'},
  {_id: 3, ask: 'บนฟ้าเป็ดร้องอู๊ด', ans: '2827'},
  {_id: 4, ask: 'กลับหัวขายอังกฤษ', ans: '7735'},
  {_id: 5, ask: 'แก้วแรดสามฤดู', ans: '3000'},
  {_id: 6, ask: 'ภัครมัยขำไข่ปลาหมึก', ans: '3508'},
  {_id: 7, ask: 'ตุ๊กตุ๊กทั่วประเทศสู้ตาย', ans: '3772'},
  {_id: 8, ask: 'เพื่อนมดชี้ทุกทิศชีวิตเหมียว', ans: '4189'},
  {_id: 9, ask: 'บุเรงนองบอกแก่นัก แต่ยอดรักบอกยังแจ๋ว', ans: '1030'},
  {_id: 10, ask: 'สไปเดอร์แมนคีบแขนทศกัณฐ์', ans: '8220'},
  {_id: 11, ask: 'พวงมาลัยมหัศจรรย์', ans: '1007'},
  {_id: 12, ask: 'องคุลีมาลโดนสนธิเดือด', ans: '1099'},
  {_id: 13, ask: 'ปลามังกรแกะปู', ans: '3147'},
  {_id: 14, ask: 'MISTERSHORTFOOT', ans: '9000'},
  {_id: 15, ask: 'กระบือยานนาวาปลาสลิด', ans: '3102'},
  {_id: 16, ask: 'เหนือท่วมใต้ฝุ่นตกแน่', ans: '1966'},
  {_id: 17, ask: 'โทรศัพท์จากอุดรไปหาทักษิณ', ans: '2580'},
  {_id: 18, ask: 'ผัวหนูปาหนี้', ans: '2559'},
  {_id: 19, ask: 'สร้อยเสือเผ่น สยองยักษ์เร้นหลบหนี', ans: '1002'},
  {_id: 20, ask: 'รถไฟไทยสามสีมีนายกฯ', ans: '5867'},
  {_id: 21, ask: 'ชู้เมาฆ่าตีนแมว', ans: '3512'},
  {_id: 22, ask: 'น้ำพริกปลายามาเย็นตาปาดังเบ', ans: '2543'},
  {_id: 23, ask: 'ตี๋ใหญ่ขำไม่ได้ เสือไบก็ไม่ฮา', ans: '0000'},
  {_id: 24, ask: 'พักนี้กี้ไม่อยู่', ans: '1000'},
  {_id: 25, ask: 'ฉันเห็นฝรั่งตัวใหญ่ในกระจก', ans: '3321'},
  {_id: 26, ask: 'ก่อนอี้ล้มเณรเปื้อน', ans: '9638'},
  {_id: 27, ask: 'ประหยัดไฟกลางคืน', ans: '1245'},
  {_id: 28, ask: 'แก๊งสามช่านั่งยองๆ', ans: '2400'},
  {_id: 29, ask: 'อ่างอึ่งอ๋องอ๋องอึ่ง', ans: '1221'},
  {_id: 30, ask: 'จุรีรักจา', ans: '1310'},
  {_id: 31, ask: 'หินอ่อนแจ้งพระแก้ว', ans: '5101'},
  {_id: 32, ask: 'อาตมาฉันมันมัน', ans: '1133'},
  {_id: 33, ask: 'อีกท้ายนรสิงห์ ยศจริงพลายงาม', ans: '9000'},
  {_id: 34, ask: 'มนุษย์หลังฉาก', ans: '9037'},
  {_id: 35, ask: 'ลบห้าสอยกระทิงทิ้งสิบห้า', ans: '1512'},
  {_id: 36, ask: 'กรมกสิกรตอนต้นเดือน', ans: '7181'},
  {_id: 37, ask: 'กดเหนือดาราเลี้ยวขวาเมื่อสุด', ans: '7412'},
  {_id: 38, ask: 'อาหารหน้าเห็ดหลังเป็ดนับปี', ans: '1210'},
  {_id: 39, ask: 'ไฮโซหน้าเล็ก เขียนเช็คกลับหัว', ans: '0514'},
  {_id: 40, ask: '007', ans: '2017'},
  {_id: 41, ask: 'ความหลังในโหล', ans: '1162'},
  {_id: 42, ask: 'ผู้ดีอ่านข่าวบนนาฬิกาไม่ออก', ans: '1296'}
]);
*/