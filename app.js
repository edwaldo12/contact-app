const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const { body, validationResult, check } = require('express-validator');
const methodOverride = require('method-override');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

require('./utils/db');
const Contact = require('./model/contact');
const { Mongoose } = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

//setup method override
app.use(methodOverride('_method'));

//Setup EJS
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

//konfigurasi flash
app.use(cookieParser('secret'));
app.use(session({
    cookie: { maxAge : 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(flash());

//Halaman home
app.get('/', (req, res) => {
    const mahasiswa = [
        {
            nama: 'Sandhika Galih',
            email: 'sandhikagalih@gmail.com'
        },
        {
            nama: 'Sandhika Galih1',
            email: 'sandhikagalih1@gmail.com'
        },
        {
            nama: 'Sandhika Galih2',
            email: 'sandhikagalih2@gmail.com'
        },
    ];
    res.render('index', {
        nama: 'Sandhika Galih',
        title: 'Home',
        mahasiswa,
        layout : 'layouts/main-layout'
    });
});

//Halaman about
app.get('/about', (req, res,next) => {
    // res.send('ini about!')
    // res.sendFile('./about.html', { root: __dirname });
    res.render('about', {
        layout : 'layouts/main-layout',
        title: 'Halaman About'
    });
});

//Halaman contact
app.get('/contact', async (req, res) => {
    // let contacts = Contact.find().then((contact) => {
    //     res.send(contact);
    // });

    const contacts = await Contact.find();

    console.log(contacts);
    res.render('contact', {
        layout : 'layouts/main-layout',
        title: 'Halaman Contact',
        contacts: contacts,
        msg: req.flash('msg')
    });
});

//halaman form tambah data contact
app.get('/contact/add', (req, res) => {
    res.render('add-contact', {
        title: "Form tambah data contact",
       layout : "layouts/main-layout" 
    });
});

//proses tambah data contact
app.post('/contact', [
    body('nama').custom(async (value) => {
        const duplikat = await Contact.findOne({nama:value});
        if (duplikat) {
            throw new Error('Nama Contact sudah digunakan!');
        }
        return true;
    }),
    check('email','Email Tidak Valid!').isEmail(),
    check('nohp','No Hp Tidak Valid!').isMobilePhone('id-ID')
],
 (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         res.render('add-contact', {
             title: 'Form tambah data contact',
             layout: 'layouts/main-layout',
             errors: errors.array()
         });
     } else {
         Contact.insertMany(req.body, (error,result) => {
         //kirim flash message
         req.flash('msg', 'Data Contact Berhasil Ditambahkan');
         res.redirect('/contact');             
         });
     }
    });

//halaman detail contact
app.get('/contact/:nama', async (req, res) => {
    let contact = await Contact.findOne({nama : req.params.nama});
    res.render('detail', {
        layout : 'layouts/main-layout',
        title: 'Halaman Detail Contact',
        contact
    });
});

app.delete('/contact', (req, res) => {
    Contact.deleteOne({ nama: req.body.nama }).then((result) => {
        req.flash('msg', 'Data Contact Berhasil Dihapus');
        res.redirect('/contact');
    }).catch((error) => {
        console.log(error)
    })
});

//form ubah data contact
app.get('/contact/edit/:nama', async (req, res) => {
    let contact = await Contact.findOne({nama : req.params.nama});
    res.render('edit-contact', {
        title: "Form edit data contact",
        layout: "layouts/main-layout",
        contact
    });
});

//proses ubah data
app.put('/contact', [
    body('nama').custom(async (value, {req}) => {
        const duplikat = await Contact.findOne({nama : value});
        if (value !== req.body.oldNama && duplikat) {
            throw new Error('Nama Contact sudah digunakan!');
        }
        return true;
    }),
    check('email','Email Tidak Valid!').isEmail(),
    check('nohp','No Hp Tidak Valid!').isMobilePhone('id-ID')
],
 (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
         res.render('edit-contact', {
             title: 'Form Ubah data contact',
             layout: 'layouts/main-layout',
             errors: errors.array(),
             contact : req.body
         });
     } else {
         Contact.updateOne(
             { _id: req.body._id },
             {
                 $set: {
                     nama: req.body.nama,
                     email: req.body.email,
                     nohp : req.body.nohp
                 }
             }
         ).then((result) => {
        //  kirim flash message

         req.flash('msg', 'Data Contact Berhasil Diubah');
         res.redirect('/contact');
         });
     }
    });

app.listen(port, () => {
    console.log(`Mongo Contact App | listening at http://localhost:${port}`);
});

