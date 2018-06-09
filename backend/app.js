const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const bodyparser = require('body-parser');
const cookieparser = require('cookie-parser');
const Mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const Config = require('./module/configuration.js');//Configration Data e.g>host url, key value...

const Mail = require('./module/mailsend.js');

const passport = require('./module/passport');

const route = express.Router();

// const login = require('./routes/login.js')(route, passport);
const register = require('./routes/register.js')(route);

const User = require('./module/users.js').User;
const Portfolio = require('./module/portfolioes.js').Portfolio;
const Comment = require('./module/comments.js').Comment;

app.locals.pretty = true;

app.use(express.static(path.join(__dirname, 'view')));

app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:false}));
app.use(cookieparser(Config.secretCookie));

Config.KFInitialize(app, Mongoose, session, MongoStore);

// #region PassPort
app.use(passport.initialize);
app.use(passport.session);
passport.setPassport();


///////////route
app.use('/', passport.passportRouter);

app.get('/api/user/:id', (req, res)=>{//id 값의 유저 정보를 가져온다
    console.log("api user : " + req.user);
    console.log("param : " + req.params.id);

    User.findOne({'_index' : req.params.id}, (err, user)=>{//id 값의 유저 정보를 찾는다
        if(!err){//정상 동작
            if(req.user != undefined){//클라이언트가 로그인 상태 이며 현재 user와 동일할 때

                delete user._id;

                console.log("req.user._index : " + req.user._index + "₩nreq.params.id : " + req.params.id);

                if(req.user._index == req.params.id){
                    res.json({
                        login_status : true,
                        status : "",
                        user_json : user
                    })
                }
                else{//로그 아웃 상태 일 때
                    res.json({
                        login_status : false,
                        status : "",
                        user_json : user
                    })
                }

                console.log('api/user/:id 출력!')
            }
            
        }
        else{//찾기 에러가 발생했을 때
            console.log("err");
            res.json({
                login_status : false,
                status : "err",
                user_json : {
                    _name : "",
                    _email : "",
                    _pw : "",
                    _index : ""
                }
            })
        }
    })
})

app.get('/api/user', (req, res, next)=>{
    if(req.user != undefined){
        User.findOne({'_index' : req.user._index}, (err, user)=>{
            delete user._id;

            if(!err){
                res.json({
                    login_status : true,
                    status : "",
                    user_json : user
                })
            }
            else{
                res.json({
                    login_status : false,
                    status : "err",
                    user_json : user
                })
            }
        })
    }
    else{
        res.json({
            login_status : false,
            status : "",
            user_json : {
                _name : "Login",
                _email : "",
                _pw : "",
                _index : ""
            }
        })
    }
})

app.get('/user/:id', (req, res, next)=>{
    console.log('user');

    next();
})

app.get('/api/portfolioes', (req, res, next) => { //포트폴리오 목록 가져오기
    Portfolio.find((err, portfolioes) => {
        if(!err){
            res.status(200).json(portfolioes);
        }
        else{
            res.status(500).json({
                image : 'error.jpg',
                title : 'error',
                body : '죄송합니다. 에러가 발생했습니다.'
            })
        }
    })
})

app.get('/api/portfolio/:title', (req, res, next) => { //해당 포트폴리오 가져오기
    Portfolio.findOne({'title' : req.params.title }, (err, portfolio) => {
        delete portfolio._id;

        if(!err){
            if(!portfolio){
                res.status(404).json({
                    image : 'error.jpg',
                    title : '404 error',
                    body : '죄송합니다. 해당 자료는 찾을 수 없습니다.'
                })
            }
            else{
                res.status(200).json(portfolio);
            }
        }
        else{
            res.status(500).json({
                image : 'error.jpg',
                title : 'error',
                body : '죄송합니다. 에러가 발생했습니다.'
            })
        }
    })
    
})

app.post('/api/portfolio', (req, res, next) => { //새로운 포트폴리오 등록
    console.log(req.body);

    Portfolio.findOne({'title' : req.body.title}, (err, portfolio) => {
        if(!err){
            console.log(portfolio);
            
            if(portfolio == null){
                new Portfolio(req.body).save((err) => {
                    if(!err){
                        res.status(200).json({ 
                            result : 'success',
                            body : '자료 등록을 완료했습니다.'
                        })
                    }
                    else{
                        res.status(500).json({
                            result : 'error',
                            body : '죄송합니다. 에러가 발생했습니다.'
                        })
                    }
                })
            }
            else {
                res.status(500).json({
                    result : 'error',
                    body : '죄송합니다. 이미 존재하는 자료입니다.'
                })
            }
        }
        else{
            res.status(500).json({
                result : 'error',
                body : '죄송합니다. 에러가 발생했습니다.'
            })
        }
    })
})

app.get('/portfolio/:title', (req, res, next) => {
    
    
    next();
})



app.get('/contact', (req, res, next) => {
    console.log('contact');

    next();
})

app.post('/contact', (req, res, next)=>{
    var option = {
        name : req.body.name,
        tel : req.body.tel,
        body : req.body.message,
        email : req.body.email
    }

    Mail.send(option);
    //res.end();
    //next();
    res.redirect('/contact/result');
})

app.get('/contact/result', (req, res, next)=>{
    // res.send(`
    //     <h1>완료</h1>
    //     <a href="/">되돌아가기</a>`)
    next();
})

app.get('/login', (req, res, next)=>{
    console.log('hello');

    next();
});

app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
})

app.get('/testdownload', (req, res)=>{
    res.download("./download/How to use 'git'.pdf");
})

app.get('/download/:id', (req, res) => {
    res.download('./download/' + req.params.id);
})

app.get('/download/resume/:id', (req, res)=>{
    res.download('./download/' + req.params.id + '.pdf', '고명석_이력서.pdf');
})

app.get('/api/feedback', (req, res, next)=>{//댓글들 가져오기
    Comment.find({}, (err, comments)=>{
        res.status(200).json(comments);
        console.log(comments);
    })
})

app.post('/api/feedback', (req, res) =>{//댓글 달기
    if(req.user === undefined){
        res.status(500).json({
            'message' : '로그인을 해주세요!',
            'result' : '2'
        });
    }
    Comment.find({}, (err, comments)=>{
        if(!err){
            new Comment({
                '_comment' : req.body.comment,
                '_name' : req.user._name,
                '_pw' : req.user._pw,
                '_provider' : req.user._provider,
                '_email' : req.user._email
            }).save(err => {
                if(!err){
                    res.status(200).json({
                        'message' : '댓글 작성을 성공했습니다.',
                        'result' : '1'
                    });
                }
                else{
                    res.status(500).json({
                        'message' : '댓글 작성 중 에러가 발생했습니다.',
                        'result' : '0'
                    })
                }
            })
        }
        else{
            res.status(500).json({
                'message' : '댓글 작성 중 에러가 발생했습니다.',
                'result' : '0'
            })
        }
    })
})

app.put('/api/feedback/:id', (req, res) => {//특정 댓글 수정하기
    console.log('put');

    Comment.findByIdAndUpdate(req.params.id, {$set : req.body},{new : true}, (err, comment)=>{
        console.log('db');

        if(err)
            res.status(500).json({
                'message' : '에러가 발생했습니다.',
                'result' : '0'
            })
        else{
            // comment._comment = req.body.comment;
            // comment.save(err=>{
            //     if(err){
            //         res.status(500).json({
            //             'message' : '에러가 발생했습니다.',
            //             'result' : '0'
            //         })
            //     }
            //     else{
            //         res.status(200).json({
            //             'message' : '수정이 완료됬습니다.',
            //             'result' : '1'
            //         })
            //     }
            // })
            res.status(200).json({
                'message' : '수정이 완료됬습니다.',
                'result' : '1'
            })
        }
    })
})

app.delete('/api/feedback/:id', (req, res) => {//특정 댓글 삭제하기
console.log(req.params.id);

    Comment.findByIdAndRemove({'_id' : req.params.id}, (err, comment)=>{
        if(err)
            res.status(500).json({
                'message' : '에러가 발생했습니다.',
                'result' : '0'
            })
        else
            res.status(200).json({
                'message' : '삭제 완료됬습니다.',
                'result' : '1'
            })
    })
})

//app.use('/login', login);
// app.use('/register', register);

app.get('/*', (req, res)=>{
     res.sendFile(path.join(__dirname, 'view/index.html'));
     //res.render(path.join(__dirname, 'view/index.html'));
     // res.json(req.user._id);
     //console.log()
 })

Config.serverOn(app);