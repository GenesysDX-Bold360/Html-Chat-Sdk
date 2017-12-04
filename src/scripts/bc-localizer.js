var bc = window.bc = (window.bc || {});

/**
 * An instance of {@link bc.Localizer}
 * @typedef {(object)} Localizer
 */

/**
 *
 * @param {object} [localizationValues] - The initial set of values, or an empty set if undefined.
 * @constructor
 */
bc.Localizer = function(localizationValues) {
	var scope = this;
	var locValues = localizationValues || {};
	var hasValues = false;

	this.hasLocalizedValues = function() {
		return hasValues;
	};

	/**
	 * Sets the current set of localiaztion values.
	 * @param {object} values - The key-value pairs of localization items.
	 */
	this.setLocalizationValues = function(values) {
		hasValues = values ? true : false;
		locValues = values;
		scope.updateLocalizedValues();
	};

	/**
	 * Gets the localization value for a given key
	 * @param {string} key - The key of the value to fetch.
	 * @return {string} - The value of the key, or an empty string.
	 */
	this.getLocalizedValue = function(key) {
		return locValues[key] || '';
	};

	/**
	 * Localizes all elements which has data-l10n attributes set.
	 * @param rootElement - Root element. If not set then the whole body will be updated.
	 */
	this.updateLocalizedValues = function(rootElement) {
		var elements = rootElement ? rootElement.querySelectorAll('*[data-l10n]') : document.querySelectorAll('*[data-l10n]');
		for(var i = 0; i < elements.length; i++) {
			var e = elements[i];
			var key = e.getAttribute('data-l10n');

			if(key) {
				var text = scope.getLocalizedValue(key);
				if(text) {
					var suffix = e.getAttribute('data-l10n-suffix');
					if(suffix) {
						text += suffix;
					}

					switch(e.nodeName) {
						case 'LABEL':
							if(!e.children.length) {
								e.innerHTML = text;
							}
							else {
								bc.util.log('Not implemented', true);
							}
							break;

						case 'OPTGROUP':
							e.setAttribute('label', text);
							break;

						case 'INPUT':
							e.value = text;
							break;

						case 'TEXTAREA':
							var placeholder = e.getAttribute('data-l10n-placeholder');
							if(placeholder) {
								if(placeholder !== 'useText') {
									text = scope.getLocalizedValue(placeholder);
								}
								e.placeholder = text;
							} else {
								e.innerHTML = text;
							}
							break;

						default:
							e.innerHTML = text;
							break;
					}
				} else {
					bc.util.log('No localized text found for ' + key, null);
				}

				var prefixKey = e.getAttribute('data-l10n-prefix');
				if(prefixKey) {
					var prefixValue = scope.getLocalizedValue(prefixKey);
					if (prefixValue && prefixValue.length > 0) {
						prefixValue += ' ';
					}
					e.innerHTML = prefixValue + e.innerHTML;
				}
			}
		}

		var elements = rootElement ? rootElement.querySelectorAll('input[data-l10n-placeholder]') : document.querySelectorAll('input[data-l10n-placeholder]');
		for(var i = 0; i < elements.length; i++) {
			var e = elements[i];
			var key = e.getAttribute('data-l10n-placeholder');

			if(key) {
				var text = scope.getLocalizedValue(key);
				if(text) {
					e.placeholder = text;
				}
			}
		}
	};
};
