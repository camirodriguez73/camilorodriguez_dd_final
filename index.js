// Intitialize express, handlebars, body-parser
// initialize express
const express = require('express')
const app = express()
const port = process.env.port || 3000

//initialize handlebars
const handlebars = require('express-handlebars')
app.engine('handlebars', handlebars.engine())
app.set('view engine', 'handlebars')

//import body-parser
const bodyParser = require('body-parser')

//Initialize bodyparser.. converts POST request objects to json
app.use(bodyParser.urlencoded({ extended: true }))

// Initialize listener
app.listen(port, () => {
    console.log(`server started on http://localhost:${port}  ctrl + c to terminate`)
})

// Intialize sequelize models
//Define our models and init database 
const { Sequelize, Model, DataTypes } = require('sequelize')

//Create a sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
})

// Create your first Model - List
const List = sequelize.define('Lists', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
})

// Create your second Model - Task
const Task = sequelize.define('Tasks', {
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    priority: DataTypes.STRING,
})

// Make the relationship to Lists
Task.belongsTo(List)
List.hasMany(Task)

//sync the models to the database
sequelize.sync();

// Main pages
// dashboard, display last 3 lists
app.get('/', async (request, response) => {
    const lists = await List.findAll({
        order: [['createdAt', 'DESC']],
        limit: 3,
        include: Task,
    });
    response.type('text/html')
    response.render('dashboard', { lists: lists.map(list => list.get({ plain: true })) });
});

// lists, display all lists
app.get('/lists', async (request, response) => {
    const lists = await List.findAll().then(lists => {
        response.type('text/html')
        response.render('lists', { lists })
    });
});

// admin, update lists and tasks
app.get('/admin', async (request, response) => {
    const lists = await List.findAll().then(lists => {
        response.type('text/html')
        response.render('admin', { lists })
    });
});

// List Model Management (CRUD)
// Create a new list
app.post('/lists/create', async (request, response) => {
    const newList = await List.create({
        name: request.body.name,
        description: request.body.description,
        deadline: request.body.deadline
    });
    console.log(newList)
    response.type('text/html')
    response.redirect(`${request.baseUrl}/../lists`);
});

// Read and display specific list by id
app.get('/lists/:id', async (request, response) => {
    const lists = await List.findOne({
        where: { id: request.params.id },
        include: Task,
    });
    response.type('text/html');
    response.render('singleList', { lists: lists.get({ plain: true }) });
});

// View the edit window for an individual List
app.get('/lists/edit/:id', async (request, response) => {
    const lists = await List.findOne({
        where: { id: request.params.id },
        include: Task,
    }).then((lists) => {
        console.log(lists.get({ plain: true }))
        response.type('text/html')
        response.render('editList', { lists: lists.get({ plain: true }) })
    });
});

// Update (POST) an individual List
app.post('/lists/edit', async (request, response) => {
    const lists = await List.findByPk(request.body.id);
    console.log(lists)
    console.log(request.body.id)
    await lists.update({
        name: request.body.name,
        description: request.body.description,
        deadline: request.body.deadline
    }).then(() => {
        lists.save()
        response.type('text/html')
        response.redirect('/lists')
    });
});

// Delete an individual List
app.get('/lists/delete/:id', async (request, response) => {
    const lists = await List.findByPk(request.params.id);
    console.log(lists)
    lists.destroy();
    response.type('text/html')
    response.redirect('/lists')
});

// Task Model Management (CRUD)
// create a new task
app.post('/tasks/create', async (request, response) => {
    console.log("this is the request");
    console.log(request.body);

    const list = await List.findByPk(request.body.listId);
    const newTask = await list.createTask({
        name: request.body.name,
        description: request.body.description,
        priority: request.body.priority,
    });
    response.type('text/html');
    response.redirect(`${request.baseUrl}/../admin`);
});

app.post('/tasks/delete/:id', async (request, response) => {
    const task = await Task.findByPk(request.params.id);
    await task.destroy();
    response.type('text/html');
    response.redirect(`${request.baseUrl}/../`);
});


