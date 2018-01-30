const ChangePropertyArrayPrototypeMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'reverse',
  'fill',
  'sort'
];

const arrayProps = Object.getOwnPropertyNames( Array.prototype );


const ObservableArray = function( data, designation, rootContext ) {

  let instance = Object.create( ObservableArray.prototype );

  Object.defineProperty( instance, 'items', {
    enumerable: false,
    value: data
  });

  Object.defineProperty( instance, 'designation', {
    enumerable: false,
    writable: true,
    value: designation
  });

  Object.defineProperty( instance, 'rootContext', {
    enumerable: false,
    writable: true,
    value: rootContext
  });

  arrayProps.map( key => {

    if ( typeof Array.prototype[ key ] === 'function' && ChangePropertyArrayPrototypeMethods.indexOf( key ) >= 0 ) {

    if ( ! instance.items.hasOwnProperty( key ) ) {

      Object.defineProperty( instance.items, key, {

        enumerable: false,

        value:  (arguments) => {

        Array.prototype[ key ].apply( instance.items, [arguments] );

      instance.items.map( ( item, index ) => {

        if ( Array.isArray( item ) && ! ( item instanceof ObservableArray ) ) {

        instance.items[ index ] = new ObservableArray( item, instance.designation + '[' + index + ']', instance.rootContext ).items

      } else {

        if ( item && typeof item === 'object' && ! ( item instanceof Observable ) ) {

          instance.items[ index ] = new Observable( item, instance.designation + '[' + index + ']', instance );

        }

      }

    });

      instance.rootContext.changeProperty( instance.designation, instance.items );

    }

    });

    }
  }

});

  instance.items.map( ( item, index ) => {

    if ( Array.isArray( item ) && ! ( item instanceof ObservableArray ) ) {

    instance.items[ index ] = new ObservableArray( item, instance.designation + '[' + index + ']', instance.rootContext ).items

  } else {

    if ( item && typeof item === 'object' && ! ( item instanceof Observable ) ) {

      instance.items[ index ] = new Observable( item, instance.designation + '[' + index + ']', instance );

    }

  }

});

  return instance;

};


const Observable = function( options, designation, rootContext ) {

  let instance = Object.create( Observable.prototype );

  Object.defineProperty(instance, 'ObservableData', {
    enumerable: false,
    value: {}
  });

  Object.defineProperty(instance, 'designation', {
    enumerable: false,
    writable: true,
    value: designation ? designation : ''
  });

  Object.defineProperty(instance, 'rootContext', {
    enumerable: false,
    writable: true,
    value: rootContext
  });

  Object.defineProperty(instance, 'ObservableKeys', {
    enumerable: false,
    writable: true,
    value: []
  });

  instance.init( options, designation );

  return instance;

};

Observable.subscribers = {};

Observable.prototype.initSubscribers = function() {

  let self = this;
  for ( let subscriber in this.constructor.subscribers ) {

    let w = subscriber.split('.');
    let target = this;

    w.map( item => {
      if ( target ) {
        target = target[ item ];
      }
    });

    this.constructor.subscribers[ subscriber ].map( s => {

      s.apply( self, [ target ] )

  });

  }
};

Observable.prototype.toObject = function () {

  let data = {};

  let self = this;

  this.ObservableKeys.map( prop => {

    if ( self[ prop ] instanceof Observable ) {

    data[ prop ] = self[ prop ].toObject();

  } else if ( Array.isArray( self[ prop ] ) ) {

    data[ prop ] = [];

    self[ prop ].map( item => {

      if ( item instanceof Observable ) {

      data[ prop ].push( item.toObject() );

    } else {

      data[ prop ].push( item );

    }

  });

  } else {

    data[ prop ] = self[ prop ];

  }

});

  return data;

};

Observable.prototype.init = function( options ) {

  if ( options ) {

    let keys = Object.keys( options );

    for ( let i=0; i < keys.length; i++ ) {

      let key = keys[ i ];

      this.attachProperty( key, options[ key ] );

    }

  }

};

Observable.prototype.findRoot = function( item ) {

  let self = this;

  if ( this.designation ) {

    let _item;

    this.rootContext.ObservableKeys.filter( prop => {

      if ( self.rootContext[ prop ].designation === self.designation ) {

      _item = prop;

    }

  });

    return self.rootContext.findRoot( _item );

  } else {

    if ( item ) {

      return this[ item ];

    }

    return this;
  }

};

Observable.prototype.initProperty = function( key ) {

  if ( ! this.hasOwnProperty( key ) ) {

    Object.defineProperty( this, key, {

      set: function( value ) {

        if ( this.ObservableKeys.indexOf( key ) < 0 ) {

          this.ObservableKeys.push( key );
        }

        if ( this.ObservableData[ key ] !== value ) {

          let p = this.designation ? this.designation + '.' + key : key;

          if ( value && typeof value === 'object') {

            if ( Array.isArray( value ) ) {

              this.ObservableData[ key ] = new ObservableArray( value, p, this );

            } else {

              this.ObservableData[ key ] = new Observable( value, p, this );

            }

            this.changeProperty( p, this.ObservableData[ key ] );

          } else {

            this.ObservableData[ key ] = value;

            this.changeProperty( p, value );

          }
        }
      },

      get: function() {

        if ( this.ObservableData[ key ] instanceof ObservableArray ) {

          return this.ObservableData[ key ].items;

        } else {

          return this.ObservableData[ key ];

        }
      }
    });
  }
};

Observable.prototype.attachProperty = function( key, value ) {

  if ( ! this.hasOwnProperty( key ) ) {

    this.initProperty( key );

  }

  this[ key ] = value;
};

Observable.prototype.changeProperty = function( key, value ) {

  let self = this;

  if ( value instanceof ObservableArray ) {

    value = value.items;

  }

  for ( let prop in this.constructor.subscribers ) {

    if ( prop && key ) {

      let keyData = key.split( '.' );

      if( keyData.length > 1 ) {

        if ( prop === key ) {

          this.constructor.subscribers[prop].map( subscriber => {

            subscriber.apply( self, [ value instanceof Observable ? value.toObject() : value instanceof ObservableArray ? value.items : value ] );

        });
        }

        if ( this.designation === prop ) {

          this.constructor.subscribers[prop].map( subscriber => {

            subscriber.apply( self, [ self instanceof Observable ? self.toObject() : self ] );

        });

        }

        if ( this.rootContext.designation === prop ) {


          let rc = self.rootContext;

          if ( ! rc instanceof ObservableArray ) {

            this.constructor.subscribers[ prop ].map( subscriber => {

              subscriber.apply( self, [  rc instanceof Observable ? rc.toObject() : rc ] );

          });

          }

        }

      } else {

        if ( prop === key ) {

          this.constructor.subscribers[ prop ].map( subscriber => {
            subscriber.apply( self, [ value instanceof Observable ? value.toObject() : value ] );

        });

        }
      }
    }
  }
};

Observable.prototype.subscribe = function( key, value ) {

  if ( Array.isArray( this.constructor.subscribers[ key ] ) ) {

    this.constructor.subscribers[ key ].push(value);

  } else {

    this.constructor.subscribers[ key ] = [];

    this.constructor.subscribers[ key ].push( value );

  }

};

module.exports = Observable;
