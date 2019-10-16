const TelegramBot = require(`node-telegram-bot-api`)
const TOKEN = `957524945:AAEPC7i4zp6xn8SdO7mfISidzLcuXPJMqLs`
const bot = new TelegramBot(TOKEN, { polling: true })
const express = require('express')
const mongoose = require('mongoose')

const app = express()

const server = require('http').Server(app)

const check = require('./check');

const moment = require('moment');

let lastcommand = []

let checkitem = []

app.use(express.json())
server.listen(process.env.PORT || 3000)

mongoose.connect(
  'mongodb+srv://bazante:reloading@mytestcluster-wrsvc.mongodb.net/test?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true 
  }
);

mongoose.set('useFindAndModify', false);

// BOT PART
bot.onText(/\/start/, msg => {
  let user = msg.from.first_name

  console.log(lastcommand)

  bot.sendMessage(msg.chat.id, `Welcome, ${user}!`, {
    reply_markup: {
      keyboard: [
        ['/help', '/checkin', '/checkout'],
        ['/break', '/endbreak', '/list']
      ]
    }
  })
})

bot.onText(/\/sendpic/, msg => {
  bot.sendPhoto(
    msg.chat.id,
    'https://pbs.twimg.com/media/EG8Y1ewWwAEdyut?format=png&name=small'
  )
})

bot.onText(/\/checkin/, msg => {
  let date = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});;

  let lastcmd = lastcommand
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

  if (lastcmd) {
    if (lastcmd.cmd === 'checkin') {
      bot.sendMessage(msg.chat.id, "You can't make two checkins!")
    } else {
      lastcommand.push({
        userid: msg.from.id,
        cmd: 'checkin'
      });
      bot.sendMessage(msg.chat.id, 'Set a title for your new task: ', {
        reply_markup: {
            force_reply: true
        }
        }).then(payload => {
            const replyListenerId = bot.onReplyToMessage(payload.chat.id, payload.message_id, callback => {
                check.create({title:callback.text, userid: msg.from.id, checkin:date}, function(err, item){
                    checkitem.push({
                        userid: msg.from.id,
                        id: item.id
                      });
                  });
                  bot.sendMessage(msg.chat.id, `Checked in at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}` , {
                    reply_markup: {
                        keyboard: [
                          ['/help', '/checkin', '/checkout'],
                          ['/break', '/endbreak', '/list']
                        ]
                      }
                  })
            })
        })
    }
  } else {
    lastcommand.push({
      userid: msg.from.id,
      cmd: 'checkin'
    });

    bot.sendMessage(msg.chat.id, 'Set a title for your new task: ', {
        reply_markup: {
            force_reply: true
        }
        }).then(payload => {
            const replyListenerId = bot.onReplyToMessage(payload.chat.id, payload.message_id, callback => {
                check.create({title:callback.text, userid: msg.from.id, checkin:date}, function(err, item){
                    checkitem.push({
                        userid: msg.from.id,
                        id: item.id
                      });
                  });
                  bot.sendMessage(msg.chat.id, `Checked in at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}` , {
                    reply_markup: {
                        keyboard: [
                          ['/help', '/checkin', '/checkout'],
                          ['/break', '/endbreak', '/list']
                        ]
                      }
                  })
            })
        })
  }
  // check.create({title:date'String, userid: msg.from.id, checkin:date});
})

bot.onText(/\/checkout/, msg => {
  let date = new Date();

  let lastcmd = lastcommand
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

  if (lastcmd) {
    if(lastcmd.cmd === "endbreak") {
        let checkit = checkitem
        .slice()
        .reverse()
        .find(x => x.userid === msg.from.id)

        check.findByIdAndUpdate(checkit.id, {$set:{checkout:date}}, function(err){
            console.log(err);
        });
        console.log(checkitem)
        bot.sendMessage(msg.chat.id, `Checked out at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}`)
    }
    else if(lastcmd.cmd === "break") {
        bot.sendMessage(msg.chat.id, "End your break first!")
    } 
    else if (lastcmd.cmd === 'checkout') {
        bot.sendMessage(msg.chat.id, `You need to at least check in first!`);
    } else {
      lastcommand.push({
        userid: msg.from.id,
        cmd: 'checkout'
      });

      let checkit = checkitem
        .slice()
        .reverse()
        .find(x => x.userid === msg.from.id)
      check.findByIdAndUpdate(checkit.id, {$set:{checkout:date}}, function(err){
          console.log(err)
      });
      console.log(checkitem)
      bot.sendMessage(msg.chat.id, `Checked out at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}`)
    }
  } else {
    bot.sendMessage(msg.chat.id, `You need to at least check in first!`)
  }
})

bot.onText(/\/break/, msg => {
  let date = new Date()

  let parsedDate = date

  let day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();

  var dateString = day + '-' + (month + 1) + '-' + year

  let lastcmd = lastcommand
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

  if (lastcmd) {
    if (lastcmd.cmd === 'break') {
      bot.sendMessage(msg.chat.id, "You can't start two breaks!")
    } if (lastcmd.cmd != 'checkin') {
      bot.sendMessage(msg.chat.id, `You need to at least check in first!`)
    } else {
      lastcommand.push({
        userid: msg.from.id,
        cmd: 'break'
      })
      
    let checkit = checkitem
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

    check.findByIdAndUpdate(checkit.id, {$set:{break:date}}, function(err){
        console.log(err);
    });

      bot.sendMessage(msg.chat.id, `Break started at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}`)
    }
  } else {
    bot.sendMessage(msg.chat.id, `You need to at least check in first!`)
  }
  // check.create({title:date'String, userid: msg.user.id, checkin:date});
})

bot.onText(/\/endbreak/, msg => {
  let date = new Date();
  let parsedDate = date

  let lastcmd = lastcommand
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

  if (lastcmd) {
    console.log(lastcmd)
    if (lastcmd.cmd != 'break') {
        bot.sendMessage(msg.chat.id, 'You need to start the break first!')
    } else {
      lastcommand.push({
        userid: msg.from.id,
        cmd: 'endbreak'
      })

    let checkit = checkitem
    .slice()
    .reverse()
    .find(x => x.userid === msg.from.id)

    check.findByIdAndUpdate(checkit.id, {$set:{endbreak:date}}, function(err){
        console.log(err);
    });
      bot.sendMessage(msg.chat.id, `Returned from break at ${moment(date).format("MMM DD/MM/YYYY, HH:mm")}`)
    }
  } else {
    bot.sendMessage(msg.chat.id, `You need to at least check in first!`)
  }
});

bot.onText(/\/list/, msg => {
    let id = msg.chat.id;
    let tracker = "*All tasks*: \n\n";
    let total = 0;
    check.find({userid:id}, function(err,docs){
        if(!docs.length) {
            tracker = "*No tasks to show! Create a new task with /checkin*"
        }
        if (err) throw err;
        docs.forEach(function(item){
            let checkin = new moment(item.checkin).format("MMM DD/MM/YYYY, HH:mm");
            let checkout = new moment(item.checkout).format("MMM DD/MM/YYYY, HH:mm");

            let a = new moment(item.checkin);
            let b = new moment(item.checkout);

            let name = item.title;

            if(!(typeof item.break==="undefined")) {
                let brk = new moment(item.break).format("MMM DD/MM/YYYY, HH:mm");
                let endbreak = new moment(item.endbreak).format("MMM DD/MM/YYYY, HH:mm");
                let c = new moment(item.break);
                let d = new moment(item.endbreak);
                let totalbreak = d.diff(c, 'hours') > 0 ? d.diff(c, 'hours') : d.diff(c, 'minutes');
                

                let difference = moment.duration(b.diff(a, 'hours')).subtract(totalbreak)+" hours"
                
                let fortotal = moment.duration(b.diff(a, 'minutes')).subtract(totalbreak);

                totalbreak = d.diff(c, 'hours') > 0 ? 
                (d.diff(c, 'hours') == 1 ? d.diff(c, 'hours')+" hour" : d.diff(c, 'hours')+" hours") 
                : (d.diff(c, 'minutes') == 1 ? d.diff(c, 'minutes')+" minute" : d.diff(c, 'minutes')+" minutes");
                
                total+=fortotal;
                tracker+=`*Task:* ${name}\n*Checkin at* ${checkin}\n*Checkout at* ${checkout}\n*Break of* ${totalbreak}\n*Total spent in task*: ${difference} \n\n`;
            } else {

                let difference = b.diff(a, 'hours') > 0 
                ? (b.diff(a, 'hours') > 1 ? b.diff(a, 'hours')+" hours" : b.diff(a, 'hours')+" hour")
                : (b.diff(a, 'minutes') > 1 ? b.diff(a, 'minutes')+" minutes" : b.diff(a, 'minutes')+" minute");

                let fortotal = b.diff(a, 'minutes');;
                console.log(fortotal)
                total+=fortotal;
                tracker+=`*Task:* ${name}\n*Checkin at* ${checkin}\n*Checkout at* ${checkout}\n*Total spent in task*: ${difference} \n\n`;
            }
        });
        if(tracker!="*No tasks to show! Create a new task with /checkin*") {
            total = (Math.floor(total / 60) + 'h' + total % 60+"min");
            tracker+=`*Total time worked (in hours): * ${total}` ;
        }
        bot.sendMessage(msg.chat.id, tracker, { parse_mode: 'Markdown' });
    });
    
  })

bot.onText(/\/help/, msg => {
  let message =
    'Hey! Welcome to *Workload Helper*! This is a list of commands you may use: \n' +
    '\n /start - starts the bot' +
    '\n /checkin - check in and save the timestamp' +
    '\n /checkout - check out and save the timestamp' +
    '\n /break - take a break' +
    '\n /endbreak - finish your break' +
    '\n /list - lists all timestamp you have saved'+
    '\n /deltasks - deletes all tasks (_for your security this command can only be written, not being displayed on the buttons_)';

    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

bot.onText(/\/deltasks/, function(msg, match) {
    bot.sendMessage(msg.chat.id, '*Are you sure? This will delete all your tasks and this action cannot be undone.*', {
    parse_mode: 'Markdown',     
    reply_markup: {
        force_reply: true,
        keyboard: [
            ['Yes', 'No']
        ]
    }
    }).then(ans => {
        bot.once('message', (msg) => {
            if(msg.text==="Yes"){
                let id = msg.chat.id;
                check.deleteMany({ userid: id}, function (err) {
                    console.log(err);

                    bot.sendMessage(msg.chat.id, `Done. All your tasks have been deleted. No turn back now.`, {
                        reply_markup: {
                          keyboard: [
                            ['/help', '/checkin', '/checkout'],
                            ['/break', '/endbreak', '/list']
                          ]
                        }
                      });
                });
            }
            else {
                bot.sendMessage(msg.chat.id, `Phew, at least you didn't mess up!`, {
                    reply_markup: {
                      keyboard: [
                        ['/help', '/checkin', '/checkout'],
                        ['/break', '/endbreak', '/list']
                      ]
                    }
                  })
            }
        });
    });
});
