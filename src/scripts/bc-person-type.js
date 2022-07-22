var bc = window.bc = (window.bc || {});

/**
 *  @typedef {(object)} PersonType
 */

(function() {
    /**
     * An enumeration for person type of messages
     */
    bc.PersonType = {
        Operator: 'operator',
        Visitor: 'visitor',
        System: 'system'
    };

    if(Object.freeze) {
        Object.freeze(bc.PersonType);
    }

}());
