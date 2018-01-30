#Observable-tree

npm i -s observable-tree

**create new Observable:**
```
const Observable = require('./observable');

let observable = new Observable({
  family: {
    husband:{
      name: 'John Doe'
    },
    wife: {
      name: 'Mary Gray'
    },
    children:[]
  }
});
```
**Subscribe to it's properties:**
```
observable.subscribe('family.wife.name', name => {
  console.log('New wife`s name is ' + name );
});

observable.subscribe('family.children', data => {

  console.log('Children count is ' + data.length );

  data.map(child => {
    console.log( child.name + ' is ' + child.age + ' years old')
  });

});
```
**Change them and see result:**
```
observable.family.wife.name = 'Mary Doe';

// New wife`s name is Mary Doe

observable.family.children.push( { name: 'Katie Doe', age: 7 } );

// Children count is 1
// Katie Doe is 7 years old

observable.family.children.push( { name: 'Nick Doe', age: 5 } );

// Children count is 2
// Katie Doe is 7 years old
// Nick Doe is 5 years old

observable.subscribe('family.children[1].name', name => {
  console.log('Second child name is ' + name );
});

observable.family.children[1].name = 'Nickolas Doe';

// Second child name is Nickolas Doe

observable.family.children.sort ( (a,b) => {
  return a.age - b.age;
});

// Children count is 2
// Nickolas Doe is 5 years old
// Katie Doe is 7 years old
```
