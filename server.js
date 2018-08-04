const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use(express.json());
const mysql = require('mysql');

function mySqlConn() {
    var conn = mysql.createConnection({
        host: "localhost",
        user: "root",
        database: "grabbd",
        password: "spatico"
    });
    return conn;
}

app.post('/add/actor/', (req, res) => {
    console.log(req.body.name);
    var conn = mySqlConn();
    var sql = "insert into actor (name,sex,dob,bio) values ?"
    var value = [[req.body.name, req.body.sex, req.body.dob, req.body.bio]]
    //${req.body.sex},${req.body.dob},${req.body.bio});`;
    conn.query(sql, [value], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
    //res.send("actor added")

});

app.post('/add/producer/', (req, res) => {
    var conn = mySqlConn();
    var sql = "insert into producer (name,sex,dob,bio) values ?"
    var value = [[req.body.name, req.body.sex, req.body.dob, req.body.bio]];
    conn.query(sql, [value], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
});

app.post('/add/genere/', (req, res) => {
    var conn = mySqlConn();
    var sql = "insert into genere (name,description) values ?";
    var value = [[req.body.name, req.body.description]];
    conn.query(sql, [value], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });

});

app.post('/add/certification/', (req, res) => {
    var conn = mySqlConn();
    var sql = "insert into certification (name,type,deacription) values ?"
    var value = [[req.body.name, req.body.type, req.body.description]]
    conn.query(sql, [value], (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });

});

app.post('/add/movie/', (req, res) => {
    var conn = mySqlConn();
    var sql = `insert into movie (name,description,fk_producer_id,fk_genere_id,
               fk_certificaton_id,release_date,image) values ?`
    var value = [[req.body.name, req.body.description,
    req.body.fk_producer_id, req.body.fk_genere_id, req.body.fk_certificaton_id,
    req.body.release_date, req.body.image]]
    console.log(req.body.fk_genere_id)
    conn.query(sql, [value], (err, result) => {
        console.log(err)
        if (err === null) {
            console.log(result.insertId, "message")
            if (err === null) {
                console.log(req.body.actor, "hungame")
                var inSql = `INSERT INTO actor_movie_map (fk_movie_id,fk_actor_id) values (?)`
                var mapValue = [result.insertId, req.body.actor];
                conn.query(inSql, [mapValue], (err, result) => {
                    if (err === null) {
                        console.log(result)
                    } else {
                        console.log(err, "new errr")
                        throw err;
                    }
                });
            } else {
                throw err;
            }
        } else {
            throw err;
        }
        console.log(result);
        res.send(result);
    });

});

app.post('/like-dislike/', (req, res) => {

    var conn = mySqlConn();
    //var likeOrDislike = req.body.likeOrDislike;
    //check wheather that movie and user like or dislike exist or not 
    var searchSql = `Select like_dislike from user_like_dislike where 
    fk_movie_id = ${req.body.fk_movie_id} and fk_user_id = ${req.body.fk_user_id}`
    conn.query(searchSql, (err, result) => {
        if (err == null) {
            var updateSql = `update  user_like_dislike set like_dislike = (?) 
            where fk_movie_id =  ${req.body.fk_movie_id} and fk_user_id =  ${req.body.fk_user_id}`
            conn.query(updateSql, [req.body.likeOrDislike], (err, result) => {
                if (err == null) {
                    res.send(result);
                } else {
                    throw err;
                }
            });
        } else {
            var insertSql = `insert into user_like_dislike (fk_movie_id, fk_user_id,like_dislike) values (?);`
            var value = [req.body.fk_movie_id, req.body.fk_user_id, req.body.likeOrDislike];
            conn.query(insertSql, [value], (err, result) => {
                if (err === null) {
                    res.send("like dislike updated");
                } else {
                    throw err;
                }
            });
        }

    });
});

app.get('/discover/movie/', (req, res) => {
    var conn = mySqlConn();
    console.log(req.query);
    const cnt = 0;
    for (var key in (req.query)) {
        console.log(req.query[key]);
    }
    res.send("checkthis");
});

app.get('/get/movie/', (req, res) => {
    var conn = mySqlConn();
    var sql = `Select mv.movie_id, 
    mv.name as movie_name,
    mv.release_date ,
    mv.image as image,
    mv.description as description,
    p.name as producer_name,
    GROUP_CONCAT(DISTINCT a.name ORDER BY movie_id) AS actor_name
    from producer as p 
    join movie as mv on mv.fk_producer_id = p.producer_id
    join actor_movie_map as amp on amp.fk_movie_id = mv.movie_id
    join actor as a on a.actor_id = amp.fk_actor_id group by (movie_id);`
    conn.query(sql, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });

});

app.post('/get/user/', (req, res) => {
    var conn = mySqlConn();
    var getUserInfo = `Select u.user_name as name,
                    GROUP_CONCAT(distinct uf.fk_follower_id ) as follower,
                    GROUP_CONCAT( distinct mv.name ) as movie
                    from user as u
                    join user_follower as uf on uf.fk_user_id = u.user_id
                    join user_like_dislike as uld on uld.fk_user_id = u.user_id
                    join movie as mv on mv.movie_id= uld.fk_movie_id
                    where u.user_id = ${req.body.user_id}  group by (like_dislike)`
    conn.query(getUserInfo, (err, result) => {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
});

app.listen(3000);