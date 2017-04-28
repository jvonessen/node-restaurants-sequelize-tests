const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');

const should = chai.should();

const app = require('../app');
const {Grade, Restaurant} = require('../models');

chai.use(chaiHttp);

function generateGradeData(includeDates=false, restaurantId=null) {
  const grades = ['A', 'B', 'C', 'D', 'F'];
  const grade = grades[Math.floor(Math.random() * grades.length)];
  const result = {
    inspectionDate: faker.date.past(),
    grade: grade
  }
  if (includeDates) {
    const date = faker.date.recent();
    result.createdAt = date;
    result.updatedAt = date;
  }
  if (restaurantId) {
    result.restaurant_id = restaurantId;
  }
  return result
}

function seedData(seedNum=1) {
  return seedRestaurantData()
    .then(restaurant => {
      const promises = [];
      for (let i=1; i<=seedNum; i++) {
        console.log(restaurant.id)
        promises.push(Grade.create(generateGradeData(true, restaurant.id)));
      }
      return Promise.all(promises);
    });
}

function seedRestaurantData() {
  const date = faker.date.recent();
  return Restaurant.create({
    name: faker.company.companyName(),
    borough: 'Queens',
    cuisine: 'Mexican',
    addressBuildingNumber: faker.address.streetAddress(),
    addressStreet: faker.address.streetName(),
    addressZipcode: faker.address.zipCode(),
    createdAt: date,
    updatedAt: date});
}

describe('Grades API resource', function() {

  beforeEach(function() {
    return Grade
      .truncate({cascade: true})
      .then(() => seedData());
  });


  describe('GET endpoint', function() {

    it('should return a single grade', function() {
      let grade;
      return Grade
        .findOne()
        .then(_grade => {
          grade = _grade
          return chai.request(app)
            .get(`/grades/${grade.id}`);
        })
        .then(res => {
          res.should.have.status(200);
          res.body.should.include.keys(
              'id', 'grade', 'score', 'inspectionDate');
          res.body.id.should.equal(grade.id);
          res.body.grade.should.equal(grade.grade);
        })
    });
  });

  describe('POST endpoint', function() {
    it('should add a new grade', function() {

      const newGradeData = generateGradeData();
      let restaurant;

      return Restaurant
        .findOne()
        .then(_restaurant => {
          restaurant = _restaurant;
          newGradeData.restaurantId = restaurant.id
          return chai.request(app).post('/grades').send(newGradeData)
        })
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys(
            'id', 'grade', 'score', 'inspectionDate');
          res.body.grade.should.equal(newGradeData.grade);

          return Grade.findById(res.body.id);
        })
        .then(function(grade) {
          grade.grade.should.equal(newGradeData.grade);
          grade.restaurant_id.should.equal(restaurant.id)
        });
    });
  });

  describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        grade: 'Q',
        score: 8,
        inspectionDate: faker.date.recent()
      };

      return Grade
        .findOne()
        .then(function(grade) {
          updateData.id = grade.id;
          return chai.request(app)
            .put(`/grades/${grade.id}`)
            .send(updateData);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Grade.findById(updateData.id);
        })
        .then(function(grade) {
          grade.grade.should.equal(updateData.grade);
          grade.score.should.equal(updateData.score);
        });
      });
  });

  describe('DELETE endpoint', function() {
    it('deletes a grade by id', function() {

      let grade;

      return Grade
        .findOne()
        .then(function(_grade) {
          grade = _grade;
          return chai.request(app).delete(`/grades/${grade.id}`);
        })
        .then(function(res) {
          res.should.have.status(204);
          return Grade.findById(grade.id);
        })
        .then(function(_grade) {
          should.not.exist(_grade);
        });
    });
  });

});
