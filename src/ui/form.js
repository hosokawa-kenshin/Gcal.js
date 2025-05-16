import blessed from 'blessed';

export function createAddForm(screen) {
  let formBox = screen.children.find(child => child.options.label === 'Add Event');
  if (formBox) {
    return {
      formBox,
      formFields: getExistingFormFields(formBox)
    };
  }

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
    description: blessed.textbox({
      top: 18,
      left: 2,
      width: '90%-4',
      height: 3,
      label: 'Description',
      border: { type: 'line', fg: 'white' },
      inputOnFocus: true,
      mouse: true,
    }),

    all_day: blessed.checkbox({
      top: 22,
      left: 2,
      content: 'All Day',
      checked: false,
      mouse: true,
    }),
  };

  Object.values(formFields).forEach(field => formBox.append(field));

  Object.values(formFields).forEach((field, index, fields) => {
    field.listeners('submit').forEach(listener => field.off('submit', listener));

    field.on('submit', () => {
      const nextField = fields[(index + 1) % fields.length];
      nextField.focus();
      screen.render();
    });
  });

  screen.append(formBox);
  screen.render();
  return { formBox, formFields };
}

function getExistingFormFields(formBox) {
  return {
    title: formBox.children.find(child => child.options.label === 'Event Title'),
    description: formBox.children.find(child => child.options.label === 'Description'),
    date: formBox.children.find(child => child.options.label === 'Date (YYYY-MM-DD)'),
    startTime: formBox.children.find(child => child.options.label === 'Start Time (HH:mm)'),
    endTime: formBox.children.find(child => child.options.label === 'End Time (HH:mm)')
  };
}

export function createCalendarCheckbox(screen) {
  const form = blessed.form({
    parent: screen,
    keys: true,
    width: '50%',
    height: '50%',
    top: 'center',
    left: 'center',
    border: { type: 'line' },
    style: {
      border: { fg: 'green' }
    }
  });

  const checkbox1 = blessed.checkbox({
    parent: form,
    top: 2,
    left: 2,
    content: 'Option 1',
    checked: false,
    mouse: true
  });

  const checkbox2 = blessed.checkbox({
    parent: form,
    top: 5,
    left: 2,
    content: 'Option 2',
    checked: true,
    mouse: true
  });

  const submitButton = blessed.button({
    parent: form,
    mouse: true,
    keys: true,
    shrink: true,
    padding: { left: 1, right: 1 },
    top: 8,
    left: 2,
    name: 'submit',
    content: 'Submit',
    style: {
      fg: 'white',
      bg: 'blue',
      focus: { bg: 'red' }
    }
  });

  submitButton.on('press', () => {
    form.submit();
  });

  form.on('submit', (data) => {
    console.log('Checkbox 1:', checkbox1.checked);
    console.log('Checkbox 2:', checkbox2.checked);
  });

  form.append(checkbox1);
  form.append(checkbox2);
  form.append(submitButton);
  screen.append(form);
  return form;
}
