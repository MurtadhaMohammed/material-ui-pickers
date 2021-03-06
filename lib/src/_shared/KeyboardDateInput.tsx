import * as React from 'react';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Rifm } from 'rifm';
import { useUtils } from './hooks/useUtils';
import { DateInputProps } from './PureDateInput';
import { KeyboardIcon } from './icons/KeyboardIcon';
import {
  staticDateWith1DigitTokens,
  maskedDateFormatter,
  getDisplayDate,
  checkMaskIsValidForCurrentFormat,
  getTextFieldAriaText,
} from '../_helpers/text-field-helper';

export const KeyboardDateInput: React.FC<DateInputProps> = ({
  disableMaskedInput,
  rawValue,
  validationError,
  KeyboardButtonProps,
  InputAdornmentProps,
  openPicker: onOpen,
  onChange,
  InputProps,
  mask,
  maskChar = '_',
  acceptRegex = /[\d]/gi,
  format,
  disabled,
  rifmFormatter,
  TextFieldComponent = TextField,
  keyboardIcon = <KeyboardIcon />,
  variant,
  emptyLabel,
  invalidLabel,
  labelFunc,
  hideOpenPickerButton,
  ignoreInvalidInputs,
  onFocus,
  onBlur,
  getOpenDialogAriaText = getTextFieldAriaText,
  ...other
}) => {
  const utils = useUtils();
  const [isFocused, setIsFocused] = React.useState(false);
  const getInputValue = () =>
    getDisplayDate(rawValue, utils, {
      format,
      emptyLabel,
      invalidLabel,
      labelFunc,
    });

  const [innerInputValue, setInnerInputValue] = React.useState<string | null>(getInputValue());
  const { isMaskValid: shouldUseMaskedInput, placeholder } = React.useMemo(() => {
    // formatting of dates is a quite slow thing, so do not make useless .format calls
    if (!mask || disableMaskedInput) {
      return {
        isMaskValid: false,
        placeholder: utils.formatByString(staticDateWith1DigitTokens, format),
      };
    }

    return checkMaskIsValidForCurrentFormat(mask, maskChar, format, acceptRegex, utils);
  }, [format, mask]); // eslint-disable-line

  // prettier-ignore
  const formatter = React.useMemo(
    () => shouldUseMaskedInput && mask
       ? maskedDateFormatter(mask, maskChar, acceptRegex)
       : (st: string) => st,
    [shouldUseMaskedInput, mask, maskChar, acceptRegex]
  );

  React.useEffect(() => {
    // If not using mask don't update input on state change when focused to avoid such weird thing:
    // When parsing format "yyyy" with input value "2" value parsed and input value updating to "0002"
    if ((rawValue === null || utils.isValid(rawValue)) && !isFocused) {
      setInnerInputValue(getInputValue());
    }
  }, [rawValue]); // eslint-disable-line

  const handleChange = (text: string) => {
    const finalString = text === '' || text === mask ? null : text;
    setInnerInputValue(finalString);

    const date = finalString === null ? null : utils.parse(finalString, format);
    if (ignoreInvalidInputs && !utils.isValid(date)) {
      return;
    }

    onChange(date, finalString || undefined);
  };

  const adornmentPosition = InputAdornmentProps?.position || 'end';
  const inputProps = {
    type: shouldUseMaskedInput ? 'tel' : 'text',
    disabled,
    placeholder,
    variant: variant as any,
    error: Boolean(validationError),
    helperText: validationError,
    'data-mui-test': 'keyboard-date-input',
    ...other,
    InputProps: {
      ...InputProps,
      [`${adornmentPosition}Adornment`]: hideOpenPickerButton ? (
        undefined
      ) : (
        <InputAdornment position={adornmentPosition} {...InputAdornmentProps}>
          <IconButton
            data-mui-test="open-picker-from-keyboard"
            disabled={disabled}
            aria-label={getOpenDialogAriaText(rawValue, utils)}
            {...KeyboardButtonProps}
            onClick={onOpen}
          >
            {keyboardIcon}
          </IconButton>
        </InputAdornment>
      ),
    },
  };

  if (!shouldUseMaskedInput) {
    return (
      <TextFieldComponent
        value={innerInputValue || ''}
        onChange={e => handleChange(e.currentTarget.value)}
        {...inputProps}
        onFocus={e => {
          setIsFocused(true);
          onFocus && onFocus(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur && onBlur(e);
        }}
      />
    );
  }

  return (
    <Rifm
      key={mask}
      value={innerInputValue || ''}
      onChange={handleChange}
      accept={acceptRegex}
      format={rifmFormatter || formatter}
    >
      {({ onChange, value }) => (
        <TextFieldComponent value={value} onChange={onChange} {...inputProps} />
      )}
    </Rifm>
  );
};

export default KeyboardDateInput;
