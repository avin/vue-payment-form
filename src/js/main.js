import 'core-js/es/object/assign';
import 'core-js/es/global-this';
import 'core-js/es/promise';

import Vue from 'vue/dist/vue.esm';
import creditCardType from 'credit-card-type';
import cardValidator from 'card-validator';
import { wait } from './helpers';

import alipayIcon from '../img/alipay.svg';
import amexIcon from '../img/american-express.svg';
import dinersIcon from '../img/diners-club.svg';
import discoverIcon from '../img/discover.svg';
import eloIcon from '../img/elo.svg';
import hipercardIcon from '../img/hipercard.svg';
import jcbIcon from '../img/jcb.svg';
import maestroIcon from '../img/maestro.svg';
import mastercardIcon from '../img/mastercard.svg';
import paypalIcon from '../img/paypal.svg';
import unionpayIcon from '../img/unionpay.svg';
import verveIcon from '../img/verve.svg';
import visaIcon from '../img/visa.svg';
import mirIcon from '../img/mir.svg';
import MaskDirective from './directives/mask';

// Иконки платежных систем
const icons = {
  alipay: alipayIcon,
  'american-express': amexIcon,
  'diners-club': dinersIcon,
  discover: discoverIcon,
  elo: eloIcon,
  hipercard: hipercardIcon,
  jcb: jcbIcon,
  maestro: maestroIcon,
  mastercard: mastercardIcon,
  paypal: paypalIcon,
  unionpay: unionpayIcon,
  verve: verveIcon,
  visa: visaIcon,
  mir: mirIcon,
};

function FormField({ fieldName, value = '', maskOptions, validation } = {}) {
  if (!fieldName) {
    throw new Error('fieldName is required');
  }

  const masked = IMask.createMask(maskOptions);

  this.data = function() {
    let fieldOptions = {
      value: value,

      isPotentiallyValid: true,
      isFullyValid: !validation,
      showValidationError: false,

      maskOptions,
      onAccept: e => {
        const maskRef = e.detail;
        this.fields[fieldName].value = maskRef.unmaskedValue;
      },
    };

    return {
      fields: {
        [fieldName]: fieldOptions,
      },
    };
  };

  this.watch = {
    [`fields.${fieldName}.value`]: function(val) {
      if (validation) {
        const result = validation(val);

        this.fields[fieldName].isPotentiallyValid = val === '' || result.isValid;
        this.fields[fieldName].isFullyValid = result.isValid;
      }
    },
  };
}

const app = new Vue({
  el: '#root',
  mixins: [
    new FormField({
      fieldName: 'pan',
      value: '',
      maskOptions: { mask: '0000 0000 0000 0000 000' },
      validation: val => {
        return cardValidator.number(val);
      },
    }),
    new FormField({
      fieldName: 'expiry',
      maskOptions: { mask: '00{ / }00' },
      validation: val => {
        return cardValidator.expirationDate(val);
      },
    }),
    new FormField({
      fieldName: 'cvc',
      maskOptions: { mask: '000' },
      validation: val => {
        return cardValidator.cvv(val);
      },
    }),
    new FormField({
      fieldName: 'holder',
      maskOptions: {
        mask: /^[A-Z\s]+$/,
        prepare: function(str) {
          return str.toUpperCase();
        },
      },
    }),
  ],
  data: {
    forceShowValidationErrors: false,
    fields: {
      // Поля назначаются через mixin-ы
    },
    isFinished: false,
    isSubmitInProgress: false,
    cvcInputType: (() => {
      const style = window.getComputedStyle(document.createElement('input'));
      if (style.webkitTextSecurity === undefined) {
        return 'password';
      }
      return 'tel';
    })(),
  },
  computed: {
    errorFields: function() {
      const errorFields = new Set();
      for (const fieldName in this.fields) {
        let showError = do {
          if (this.forceShowValidationErrors) {
            !this.fields[fieldName].isFullyValid;
          } else {
            !this.fields[fieldName].isPotentiallyValid;
          }
        };
        if (showError) {
          errorFields.add(fieldName);
        }
      }
      return errorFields;
    },
    cardType: function() {
      const cardNumber = this.fields.pan.value;
      const cardTypes = creditCardType(cardNumber);
      if (cardTypes.length === 1) {
        // Выводим только если результат только в одном варианте
        return cardTypes[0];
      }
    },
    cardTypeIcon: function() {
      const cardType = this.cardType;
      if (cardType) {
        return icons[cardType.type];
      }
    },
    cardTypeCvcName: function() {
      const cardType = this.cardType;
      if (cardType) {
        return cardType.code.name;
      }
      return 'CVC/CVV';
    },
    canSubmit: function() {
      let result = true;
      for (const fieldName in this.fields) {
        result = result && this.fields[fieldName].isFullyValid;
      }
      return result;
    },
    showCheckFormWarning: function() {
      return !this.canSubmit && this.forceShowValidationErrors;
    },
  },
  methods: {
    submitForm: async function() {
      // Если форма уже в процессе сабмита - ничего не делаем
      if (this.isSubmitInProgress) {
        return;
      }

      // Если есть ошибка в форме
      if (!this.canSubmit) {
        // Будем показывать все ошибки
        this.forceShowValidationErrors = true;

        // Переводим фокус на невалидный элемент
        this.$nextTick(() => {
          this.$el.querySelector('.is-invalid').focus();
        });

        return;
      }

      this.isSubmitInProgress = true;

      await wait(2000);

      this.isFinished = true;
    },
  },
  directives: {
    mask: MaskDirective,
  },
});

// Выставляем фокус на ввод карты
document.querySelector('#cc-number').focus();
