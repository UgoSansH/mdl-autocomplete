(function() {
    "use strict";


    if (!Element.prototype.parents) {
        Element.prototype.parents = function(selector)
        {
            if (this.matches) {
                if (this.matches(selector)) {
                    return this;
                }

                for (var target = this.parentNode; target && target != this; target = target.parentNode) {
                    if (target.matches(selector)) {
                        return target;
                    }
                }
            }

            return null;
        };
    }


    if (!Element.prototype.isOutside) {
        Element.prototype.isOutside = function(element)
        {
            if (this == element) {
                return false;
            }

            for (var target = this.parentNode; target && target != this; target = target.parentNode) {
                if (target == element) {
                    return false;
                }
            }

            return true;
        };
    }

})();
