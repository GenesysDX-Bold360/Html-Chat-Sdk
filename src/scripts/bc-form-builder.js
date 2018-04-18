var bc = window.bc = (window.bc || {});


/**
 *  @typedef {(object)} FormBuilder
 */

/**
 * This class dynamically builds a pre or post chat form based on a form definition sent from the server.
 * @param {Localizer} localizer - A localizer instance.
 * @constructor
 */
bc.FormBuilder = function(localizer) {

	var scope = this;
	var createContainer = function(className) {
		var util = bc.util;
		var div = util.createElement('div', {class: 'bc-input-container'});
		util.addClass(div, className);
		return div;
	};


	this.createPlaceholder = function(e, placeholder, placeholderKey, placeholderSuffix) {
		var tmpE = bc.util.isNodeList(e) ? e[0] : e;
		tmpE.name = tmpE.id;

		var labelForInputPlaceholder = bc.util.createElement('label', {
			'class': 'bc-input-label',
			'for': tmpE.id,
			'data-l10n': placeholderKey
		}, placeholder + (placeholderSuffix || ''));
		if(placeholderSuffix) {
			labelForInputPlaceholder.setAttribute('data-l10n-suffix', placeholderSuffix);
		}

		var inputPlaceholder = bc.util.createElement('div', {class: 'bc-input-placeholder'});

		if(bc.themeConfig && bc.themeConfig.placeholdersOnInputFields) {
			bc.util.setAttribute(tmpE, 'data-l10n-placeholder', placeholderKey);
		}

		if(bc.themeConfig && bc.themeConfig.labelsAfterInputFields) {
			inputPlaceholder.appendChild(tmpE);
			inputPlaceholder.appendChild(labelForInputPlaceholder);
		} else {
			inputPlaceholder.appendChild(labelForInputPlaceholder);
			inputPlaceholder.appendChild(tmpE);
		}

		return inputPlaceholder;
	};

	/**
	 *
	 * @param {string} introKey - (optional) The localization key for the intro text.
	 * @param {string} messageContent - (optional) Used to be able to pass text to the created form.
	 */
	this.createErrorForm = function(introKey, messageContent) {
		'use strict';

		var form = bc.util.createElement('form', {class: 'bc-form'});

		var createText = function(textKey, textContent) {
			return bc.util.createElement('div', {
				class: 'bc-error bc-bold',
				'data-l10n': textKey
			}, textContent || textKey);
		};

		if(introKey) {
			var bcFormIntro = createContainer('bc-form-intro');
			if(localizer.hasLocalizedValues()) {
				bcFormIntro.appendChild(createText(introKey, localizer.getLocalizedValue(introKey)));
			}
			form.appendChild(bcFormIntro);
		}

		if(messageContent) {
			form.appendChild(bc.util.createElement('div', {class: 'bc-error'}, messageContent));
		}

		return form;
	};


	this.createSelectOptions = function(selectElem, data) {
		var selectedItem;
		var unavailableGroup;
		var groups = {};

		var util = bc.util;

		if(data.Options && data.Options.length) {
			for(var counter = 0, totalLength = data.Options.length; counter < totalLength; counter++) {
				var option = data.Options[counter];
				var optionElement = util.createElement('option', {value: option.Value}, option.Name);

				if(data.ShowDepartmentStatus && option.AvailableLabel) {
					if(groups[option.AvailableLabel]) {
						groups[option.AvailableLabel].appendChild(optionElement);
					} else {
						var group = util.createElement('optgroup', {
							label: option.AvailableLabel,
							'data-l10n': option.AvailableLabelBranding
						});
						group.appendChild(optionElement);

						if(!option.Available || !unavailableGroup) {
							if(!unavailableGroup) {
								unavailableGroup = group;
							}

							selectElem.appendChild(group);
						} else {
							selectElem.insertBefore(group, unavailableGroup);
						}

						groups[option.AvailableLabel] = group;
					}
				}
				else {
					selectElem.appendChild(optionElement);
				}

				if(option.Default) {
					optionElement.setAttribute('selected', 'selected');
					selectedItem = optionElement;
				}
			}
		}

		return selectedItem;
	};

	/**
	 * Creates form DOM from the definition
	 * @param {string} introKey - The localization key for the intro text.
	 * @param {object} dataDefinition - The form definition
	 * @param {string} invalidFormKey - The localization key for invalid form error message.
	 * @param {string} submitKey - The localization key for the submit button's text.
	 * @param {function} submitCallback - The callback for when the visitor submits the form.
	 * @param {function} languageChangeCallback
	 * @param {function} topField - When set then the top item provided field key will be rendered to the top.
	 * @param {function} topFieldKey - Localization key for the top field label.
	 * @param {function} requiredFieldLabelSuffix - Suffix for the required fields key. When not set then an asterisk mark will be shown.
	 */
	this.createForm = function(introKey, dataDefinition, invalidFormKey, submitKey, submitCallback, languageChangeCallback, topField, topFieldKey, requiredFieldLabelSuffix) {
		'use strict';

		var form = document.createElement('form');
		var formItems = {};
		form.setAttribute('class', 'bc-form');
		form.setAttribute('novalidate', '');

		var validator = bc.util.createElement('div', {class: 'bc-validator', style: 'display: none'});
		var reqSuffix = requiredFieldLabelSuffix || ' *';

		var getValue = function(e) {
			if(e) {
				if(e.nodeName && e.nodeName.toLowerCase() === 'input' && e.tagName.toLowerCase() === 'radio') {
					// TODO radio buttons not supported
				} else if(e.nodeName && e.nodeName.toLowerCase() === 'select') {
					if((e.selectedIndex || e.selectedIndex === 0) && e.options && !e.options[e.selectedIndex].disabled) {
						return e.options[e.selectedIndex].value;
					} else {
						return '';
					}
				} else {
					return e.value;
				}
			}
		};

		var validateEmail = function(email) {
			var reg = /\S+@\S+\.\S+/;	//simply matches anystring@anystring.anystring
			return reg.test(email);
		};

		var validateFormItems = function(showErrors) {
			var validForm = true;
			var dataItems = {};
			var requiredErrors = null;
			var validationErrors = {};
			var setFocusTo;

			for(var fKey in formItems) {
				var item = formItems[fKey];
				var e = document.getElementById(item.ElementId);
				var val = getValue(e);

				item.Valid = true;
				if(val) {
					if(item.ValidationKeyGroup && item.ValidationFunc && typeof item.ValidationFunc === 'function') {
						item.Valid = item.ValidationFunc(val);
					}

					if(item.Valid) {
						dataItems[fKey] = val;
					}
				}

				if(showErrors) {
					if(!item.Valid || (item.Required && !dataItems[fKey])) {
						validForm = false;
						if(!requiredErrors) {
							setFocusTo = e;
						}
						bc.util.toggleClass(bc.util.closest(e, '.bc-input-container'), 'bc-invalid', true);

						if(item.Valid) {	//required error
							requiredErrors = requiredErrors || document.createElement('ul');
							requiredErrors.appendChild(bc.util.createElement('li', {'data-l10n': item.LabelKey}, item.Label));

						} else {			//invalid error
							var validationGroupErrors = validationErrors[item.ValidationKeyGroup] || [];
							validationGroupErrors.push(item);
							validationErrors[item.ValidationKeyGroup] = validationGroupErrors;
						}
					}
				}
			}

			if(showErrors) {
				if(!validForm) {
					validator.innerHTML = '';
					if(requiredErrors) {
						validator.appendChild(bc.util.createElement('span', {'data-l10n': invalidFormKey || 'api#generic#required_fields'}, localizer.getLocalizedValue('api#generic#required_fields') || 'Please fill in the required fields!'));
						validator.appendChild(requiredErrors);
					}

					if(validationErrors) {
						for(var vKey in validationErrors) {
							validator.appendChild(bc.util.createElement('span', {'data-l10n': vKey}, localizer.getLocalizedValue(vKey) || 'Please enter a valid value: '));
							var validatorUl = document.createElement('ul');
							for(var idx = 0; idx < validationErrors[vKey].length; idx++) {
								var vItem = validationErrors[vKey][idx];
								validatorUl.appendChild(bc.util.createElement('li', {'data-l10n': vItem.LabelKey}, vItem.Label));
							}
							validator.appendChild(validatorUl);
						}
					}

					localizer.updateLocalizedValues(validator);
				}

				bc.util.toggleVisibility(validator, !validForm);

				if(setFocusTo) {
					setFocusTo.focus();
				}
			}

			return {
				valid: validForm,
				values: dataItems
			};
		};

		var registerFormItem = function(e, key, required, label, labelKey, ValidationKeyGroup, ValidationFunc) {
			var elementId = 'bc-input-' + (((1 + Math.random()) * 0x10000) | 0).toString(16);
			var register = true;

			e.id = elementId;

			if(e.nodeName && e.nodeName.toLowerCase() === 'input' && e.tagName.toLowerCase() === 'radio') {
				if(formItems[key]) {
					e.name = formItems[key].ElementId;
					register = false;
				}
				else {
					e.name = elementId;
				}
			}

			bc.util.addEventListener(e, 'change', function() {
				var closestContainer = bc.util.closest(e, '.bc-input-container');
				bc.util.removeClass(closestContainer, 'bc-invalid');
				if(validateFormItems(bc.util.hasClass(form.parentNode, 'bc-invalid')).valid) {
					bc.util.removeClass(form, 'bc-invalid');
				}
			});

			if(register) {
				formItems[key] = {
					ElementId: elementId,
					Required: required,
					Label: label,
					LabelKey: labelKey,
					ValidationKeyGroup: ValidationKeyGroup,
					ValidationFunc: ValidationFunc
				};
			}
		};

		var createEmailInputLabel = function(emailInputElement, data, key) {
			var emailContainer = document.createElement('div');
			emailContainer.appendChild(bc.util.createElement('div', {
				class: 'bc-help-message',
				'data-l10n': key
			}));
			emailContainer.appendChild(emailInputElement);
			if(data.Value && data.Value.length > 0) {
				var emailInput = emailInputElement.querySelector('input');
				if(emailInput) {
					emailInput.value = data.Value;
					emailInput.className += ' bc-not-empty';
				}
			}

			return emailContainer;
		};

		var createInput = function(data, type) {
			var e = bc.util.createElement('input', {type: type, value: data.Value || ''});
			e.addEventListener('change', function() {
				// Used for css placeholder hiding/showing
				bc.util.toggleClass(this, 'bc-not-empty', !!this.value);
			});
			if(data.Value && data.Value.length > 0) {
				bc.util.toggleClass(e, 'bc-not-empty', true);
			}
			bc.util.toggleVisibility(e, !(data.ShowSelector === false));

			var validationGroupKey;
			var validationFunc;
			if(type === 'email') {
				validationGroupKey = 'api#email#error';
				validationFunc = validateEmail;
			}
			registerFormItem(e, data.Key, !!data.Required, data.Label, data.LabelBranding, validationGroupKey, validationFunc);

			if(data.Label) {
				e = scope.createPlaceholder(e, data.Label, data.LabelBranding, !!data.Required ? reqSuffix : null);
			}

			if(type === 'email' && topFieldKey) {
				return createEmailInputLabel(e, data, topFieldKey);
			} else {
				return e;
			}
		};

		var createLabel = function(data) {
			return bc.util.createElement('label', {}, data.Value);
		};

		var createTextArea = function(data) {
			var e = bc.util.createElement('textarea', null, data.Value);
			e.addEventListener('change', function() {
				bc.util.toggleClass(this, 'bc-not-empty', !!this.value);
			});
			if(data.Value && data.Value.length > 0) {
				bc.util.toggleClass(e, 'bc-not-empty', true);
			}
			bc.util.toggleVisibility(e, !(data.ShowSelector === false));
			registerFormItem(e, data.Key, !!data.Required, data.Label, data.LabelBranding);

			if(data.Label) {
				e = scope.createPlaceholder(e, data.Label, data.LabelBranding, !!data.Required ? reqSuffix : null);
			}

			return e;
		};

		var createSelect = function(data) {
			var util = bc.util;
			var selectElem = document.createElement('select');
			selectElem.addEventListener('change', function(event) {
				util.toggleClass(this, 'bc-not-empty', this.selectedIndex > 0);
				if(data.Key === 'language' && event.target && event.target.options && typeof event.target.selectedIndex !== 'undefined') {
					languageChangeCallback(event.target.options[event.target.selectedIndex].value);
				}
			});
			util.toggleVisibility(selectElem, !(data.ShowSelector === false));
			registerFormItem(selectElem, data.Key, !!data.Required, data.Label, data.LabelBranding);

			var selectedItem = scope.createSelectOptions(selectElem, data);

			if(data.Label) {
				var optionLabel = util.createElement('option', {
					disabled: true,
					'data-l10n': data.LabelBranding
				}, data.Label + (!!data.Required ? reqSuffix : ''));
				if(!!data.Required) {
					optionLabel.setAttribute('data-l10n-suffix', reqSuffix);
				}

				selectElem.insertBefore(optionLabel, selectElem.firstChild);
				if(!selectedItem) {
					selectElem.selectedIndex = 0;
				}
				bc.util.toggleClass(selectElem, 'bc-not-empty', !!selectedItem);
			}

			return selectElem;
		};


		//noinspection Eslint
		/**
		 *
		 * @param data
		 */
		var createRadio = function(data) {
			var util = bc.util;
			var e = util.createElement('div', {class: 'bc-input-radio'});
			util.toggleVisibility(e, !(data.ShowSelector === false));

			if(data.Label) {
				var span = util.createElement('span', {'data-l10n': data.LabelBranding}, data.Label + (!!data.Required ? reqSuffix : ''));
				if(!!data.Required) {
					span.setAttribute('data-l10n-suffix', reqSuffix);
				}
				e.appendChild(span);
			}

			if(data.Options && data.Options.length) {
				for(var counter = 0, totalLength = data.Options.length; counter < totalLength; counter++) {
					var option = data.Options[counter];
					var r = util.createElement('input', {type: 'radio', value: option.Value});
					registerFormItem(r, data.Key, !!data.Required, data.Label, data.LabelBranding);

					e.appendChild(util.createElement('label', {}, option.Name));
				}
			}

			return e;
		};

		var createRating = function(data) {
			//http://codepen.io/jamesbarnett/pen/vlpkh
			var util = bc.util;

			var starId = data.Key || Math.random().toString();
			var starRadioName = 'bc-star-' + starId;
			var starComponentClassName = 'bc-starrating-component';
			var starRadioClassName = 'bc-star-val';
			var starClassName = 'bc-star';
			var starLabelClassName = 'bc-star-label';

			var bcStarComponent = util.createElement('div', {class: starComponentClassName});
			var starInput = util.createElement('input', {type: 'hidden'});
			registerFormItem(starInput, data.Key, !!data.Required, data.Label, data.LabelBranding);
			bcStarComponent.appendChild(starInput);

			var ratingChanged = function(event, params, starInputId) {
				var target = event.target || event.srcElement;
				var hdnInput = target.parentElement.querySelector('#' + starInputId);
				hdnInput.value = target.value;
			};

			for(var idx = 5; idx > 0; idx--) {
				var id = 'bc-star-' + starId + idx.toString();
				var inputRadio = util.createElement('input', {
					id: id,
					class: starRadioClassName,
					type: 'radio',
					name: starRadioName,
					value: idx.toString(),
					tabindex: 0
				});
				inputRadio.addEventListener('change', function(e, params) {
					ratingChanged(e, params, starInput.id);
				});
				bcStarComponent.appendChild(inputRadio);
				bcStarComponent.appendChild(util.createElement('label', {
					for: id,
					class: starClassName,
					title: idx.toString(),
					tabindex: 0
				}));
			}

			var finalWrap = util.createElement('div', {class: 'bc-label-and-star'});
			finalWrap.appendChild(util.createElement('label', {class: starLabelClassName}, data.Label || starId));
			finalWrap.appendChild(bcStarComponent);

			return finalWrap;
		};

		var radioClicked = function(obj, hdnId) {
			return function() {
				var elements = document.getElementsByClassName('bc-checked-radio');
				for(var idx = 0; idx < elements.length; idx++) {
					bc.util.toggleClass(elements[idx], 'bc-checked-radio', false);
				}
				bc.util.addClass(this, 'bc-checked-radio');
				var hdnInput = document.getElementById(hdnId);
				if(hdnInput) {
					hdnInput.value = this.id.substring(3);
				}
			};
		};

		var createNPS = function(data) {
			var util = bc.util;
			var divContainer = document.createElement('div');
			var divNPSIntContainer = util.createElement('div', {class: 'bc-nps-interface'});
			var divNPSHeader = util.createElement('div', {class: 'bc-nps-header'});
			var divNPSRadiosContainer = util.createElement('div', {class: 'bc-nps-radios'});
			var hdnInput = util.createElement('input', {type: 'hidden', name: 'bc-record-survey-nps'});
			registerFormItem(hdnInput, data.Key, !!data.Required, data.Label, data.LabelBranding);

			if(data.Label) {
				var divHelp = util.createElement('div', {
					class: 'bc-help-message',
					'data-l10n': data.LabelBranding
				}, data.Label + (!!data.Required ? reqSuffix : ''));
				if(!!data.Required) {
					divHelp.setAttribute('data-l10n-suffix', reqSuffix);
				}
				divContainer.appendChild(divHelp);
			}

			if(data.Options && data.Options.length) {
				for(var counter = 0, totalLength = data.Options.length; counter < totalLength; counter++) {
					var option = data.Options[counter];

					if(counter === 0) {
						divNPSHeader.appendChild(util.createElement('div', {class: 'bc-nps-message-left'}, option.Name.replace('0 - ', '')));
					} else if(counter === data.Options.length - 1) {
						divNPSHeader.appendChild(util.createElement('div', {class: 'bc-nps-message-right'}, option.Name.replace('10 - ', '')));
					}

					var r = util.createElement('div', {
						class: 'bc-radio-container bc-unchecked-radio',
						id: 'rad' + counter
					}, counter.toString());
					r.addEventListener('click', radioClicked(r, hdnInput.id));
					divNPSRadiosContainer.appendChild(r);
				}
				divNPSIntContainer.appendChild(divNPSHeader);
				divNPSIntContainer.appendChild(util.createElement('div', {class: 'bc-clear'}));
				divNPSIntContainer.appendChild(divNPSRadiosContainer);
				divNPSIntContainer.appendChild(util.createElement('div', {class: 'bc-clear'}));
			}

			divContainer.appendChild(divNPSIntContainer);
			divContainer.appendChild(hdnInput);
			return divContainer;
		};

		/**
		 * Radios don't style well and are difficult to use on mobile devices, use select box instead, unless NPS.
		 * @param {object} data
		 */
		var radioFactory = function(data) {
			if(data.Key === 'nps') {
				return createNPS(data);
			} else {
				return createSelect(data);
			}
		};

		var getAdditionalClassNames = function(data) {
			if(data.Key === 'nps') {
				return 'bc-nps-container';
			} else if(data.Key === 'email' && data.Type === 'label') {
				return 'bc-center';
			} else {
				return null;
			}
		};

		var submitFormItems = function() {
			var data = validateFormItems(true);

			if(data.valid) {
				if(submitCallback && typeof submitCallback === 'function') {
					submitCallback(data.values);
				} else {
					bc.util.log('submitCallback is not provided for the form');
				}

				bc.util.addClass(form, 'bc-invalid');
			} else {
				bc.util.removeClass(form, 'bc-invalid');
			}

			return false;
		};

		var addGeneralSubmitOnEnter = function() {
			form.addEventListener('submit', function(e) {
				e.preventDefault();
				submitFormItems();
			});
		};

		var createSubmitButton = function(textKey) {
			var submitBtn = bc.util.createElement('button', {
				type: 'submit',
				class: 'bc-action-button bc-button',
				'data-l10n': textKey
			});
			submitBtn.innerHTML = '<span class="bc-action-button-span">' + localizer.getLocalizedValue(textKey) + '</span>';
			addGeneralSubmitOnEnter();
			return submitBtn;
		};

		var createText = function(textKey) {
			return bc.util.createElement('div', {'data-l10n': textKey});
		};

		if(introKey) {
			var bcFormIntro = createContainer('bc-form-intro');
			var textDiv = createText(introKey);
			var textContent = localizer.getLocalizedValue(introKey);
			if(!textContent && textContent.length === 0) {
				textDiv.textContent = introKey;	//no localization value for key. This could be due to the localization information not yet being loaded or an error occurred before the chat was created
			}
			bcFormIntro.appendChild(textDiv);
			form.appendChild(bcFormIntro);
		}

		form.appendChild(validator);

		if(dataDefinition && dataDefinition.Fields) {
			for(var i = 0, c = dataDefinition.Fields.length; i < c; i++) {
				var field = dataDefinition.Fields[i],
					builder = 'appendChild';

				if(field.Key === topField) {
					builder = 'insertBefore';
				}

				var container = createContainer(getAdditionalClassNames(field));
				switch(field.Type) {
					case 'text':
						if(field.MultiLine) {
							container.appendChild(createTextArea(field));
							form[builder](container);
						}
						else {
							container.appendChild(createInput(field, 'text'));
							form[builder](container);
						}
						break;

					case 'email':
						container.appendChild(createInput(field, 'email'));
						if(builder === 'insertBefore') {
							form[builder](container, form.firstChild);
						} else {
							form[builder](container);
						}
						break;

					case 'phone':
						container.appendChild(createInput(field, 'tel'));
						form[builder](container);
						break;

					case 'select':
						container.appendChild(createSelect(field));
						bc.util.addClass(container, 'bc-input-container-select');
						form[builder](container);
						break;

					case 'radio':
						var radio = container.appendChild(radioFactory(field));
						if(radio.tagName === 'SELECT') {
							bc.util.addClass(container, 'bc-input-container-select');
						}
						container.appendChild(radio);
						form[builder](container);
						break;

					case 'rating':
						container.appendChild(createRating(field));
						form[builder](container);
						break;

					case 'label':
						container.appendChild(createLabel(field));
						form[builder](container);
						break;

					default:
						bc.util.log('Form Builder: Not supported item type: ' + field.Type);
						break;
				}

				if(field.Key === topField && topFieldKey) {
					form[builder](createContainer().appendChild(createText(topFieldKey)));
				}
			}
		}

		if(submitKey && submitCallback && typeof submitCallback === 'function') {
			var inputContainer = createContainer('bc-action-input-container');
			inputContainer.appendChild(createSubmitButton(submitKey));
			form.appendChild(inputContainer);
		}

		localizer.updateLocalizedValues(form);

		return {form: form, formItems: formItems};
	};

	this.changeDepartments = function(departments, formItems) {
		var departmentItem = formItems[departments.Key];
		var departmentSelect = document.getElementById(departmentItem.ElementId);
		departmentSelect.innerHTML = '';
		scope.createSelectOptions(departmentSelect, departments);
		departmentSelect.selectedIndex = 0;
	};

};
