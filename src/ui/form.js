import blessed from 'blessed';

export function createAddForm(screen){
  let formBox = screen.children.find(child => child.options.label === 'Add Event');
  if (formBox) return {formBox, formFields: getExistingFormFields(formBox)};

  formBox = blessed.form({
    top: 0,
    left: '50%',
    width: '50%',
    height: '100%',
    label: 'Add Event',
    border: { type: 'line', fg: 'cyan' },
    hidden: true,
    keys: true,
  });

  const formFields = {
    title: blessed.textbox({
      top: 2,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Event Title',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    date: blessed.textbox({
      top: 6,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Date (YYYY-MM-DD)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    startTime: blessed.textbox({
      top: 10,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Start Time (HH:mm)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
    endTime: blessed.textbox({
      top: 14,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'End Time (HH:mm)',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),
  };
  Object.values(formFields).forEach((field) => formBox.append(field));
  Object.values(formFields).forEach((field, index, fields) => {
    field.on('submit', () => {
        const nextField = fields[(index + 1) % fields.length];
        nextField.focus();
        screen.render();
    });
  });
  screen.append(formBox);
  screen.render();
  return {formBox, formFields};
}

function getExistingFormFields(formBox) {
  return {
    title: formBox.children.find(child => child.options.label === 'Event Title'),
    date: formBox.children.find(child => child.options.label === 'Date (YYYY-MM-DD)'),
    startTime: formBox.children.find(child => child.options.label === 'Start Time (HH:mm)'),
    endTime: formBox.children.find(child => child.options.label === 'End Time (HH:mm)')
  };
}

export function createCalendarCheckbox(screen){
  const checkbox = blessed.checkbox({
    parent: screen,
    top: 'center',
    left: 'center',
    width: '30%',
    height: 3,
    label: ' Enable Feature',
    border: { type: 'line' },
    style: {
      fg: 'white',
      border: { fg: 'cyan' },
      focus: { bg: 'blue' }
    },
    mouse: true,
    keys: true,
    hidden: false,
  });

  checkbox.on('check', () => {
    console.log('Checked!');
  });

  checkbox.on('uncheck', () => {
    console.log('Unchecked!');
  });

  screen.append(checkbox);
  return checkbox;
}