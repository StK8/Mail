document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send the email
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // send a GET request to receive a mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // create header div
    const header_div = document.createElement('div');
    header_div.classList.add('row', 'email-list', 'header');

    // create sender div in header
    const header_sender_div = document.createElement('div');
    header_sender_div.classList.add('col-md-3', 'col-lg-3', 'col-xl-3', 'email-cells');
    if (mailbox === 'sent') {
      header_sender_div.innerHTML = 'To:';
    } else {
      header_sender_div.innerHTML = 'From:';
    }

    // create subject div in header
    const header_subject_div = document.createElement('div');
    header_subject_div.classList.add('col-md-6', 'col-lg-6', 'col-xl-6', 'email-cells');
    header_subject_div.innerHTML = 'Subject:';

    // create date div in header
    const header_date_div = document.createElement('div');
    header_date_div.classList.add('col-md-3', 'col-lg-3', 'col-xl-3', 'email-cells');
    header_date_div.innerHTML = 'Date:'

    // add sender, subject and date divs to header div
    header_div.appendChild(header_sender_div);
    header_div.appendChild(header_subject_div);
    header_div.appendChild(header_date_div);

    // add header to the HTML document
    document.querySelector('#emails-view').append(header_div);

    // create div for each email, populate it with data and add it to the mailbox page
    emails.forEach((email) => {

        // create email div
        const email_div = document.createElement('div');
        email_div.classList.add('row', 'email-list');

        // view email once clicked
        email_div.addEventListener('click', function() {
            view_email(email.id, mailbox);
        });

        // if email has been read, then change background color of email
        if (mailbox === 'inbox' && email.read) {
            email_div.style.backgroundColor = '#D3D3D3';
        }

        // create div for email sender/recipients
        const sender_div = document.createElement('div');
        sender_div.classList.add('col-md-3', 'col-lg-3', 'col-xl-3', 'email-list-address', 'email-cells');
        if (mailbox === 'sent') {
            sender_div.innerHTML = email.recipients;
        } else {
            sender_div.innerHTML = email.sender;
        }

        // create div for email subject
        const subject_div = document.createElement('div');
        subject_div.classList.add('col-md-6', 'col-lg-6', 'col-xl-6', 'email-list-subject', 'email-cells');
        subject_div.innerHTML = email.subject;

        // create div for email timestamp
        const timestamp_div = document.createElement('div');
        timestamp_div.classList.add('col-md-3', 'col-lg-3', 'col-xl-3', 'email-list-timestamp', 'email-cells');
        timestamp_div.innerHTML = email.timestamp;

        // add sender, body and timestamp divs
        email_div.appendChild(sender_div);
        email_div.appendChild(subject_div);
        email_div.appendChild(timestamp_div);

        // add resulting email div to the HTML document
        document.querySelector('#emails-view').append(email_div);

    })
  });



}

function send_email() {

    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
    // Print result
        console.log(result);
        load_mailbox('sent');
    });
    return false;
}

function view_email(email_id, mailbox) {

    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {

        // once email opened, mark it as 'read'
        fetch(`emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
        });

        // clear the div contents to avoid buttons duplicating
        document.querySelector('#email-buttons').innerHTML = '';

        // Fill email header with data
        document.querySelector('#email-header-sender').innerHTML = email.sender;
        document.querySelector('#email-header-recipients').innerHTML = email.recipients;
        document.querySelector('#email-header-subject').innerHTML = email.subject;
        document.querySelector('#email-header-timestamp').innerHTML = email.timestamp;

        // Fill email body with data
        document.querySelector('#email-body-text').innerHTML = email.body;

        // create 'Reply' button
        const reply_button = document.createElement('button');
        reply_button.innerHTML = 'Reply';
        reply_button.classList.add('btn', 'btn-primary', 'mr-1');
        reply_button.addEventListener('click', function() {
            compose_email();
            // prepopulate form fields
            document.querySelector('#compose-recipients').value = email.sender;

            const re_string = 'Re: ';
            const regexp = new RegExp(re_string);
            if (regexp.test(email.subject) === false) {
                document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            } else {
                document.querySelector('#compose-subject').value = email.subject;
            }

            document.querySelector('#compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
            // autofocus on the first line of the prepopulated textarea
            document.querySelector('#compose-body').setSelectionRange(0, 0);
            document.querySelector('#compose-body').focus();
        });

        document.querySelector('#email-buttons').append(reply_button);

        // create 'Archive/Unarchive' button
        const archive_button = document.createElement('button');
        archive_button.classList.add('btn', 'btn-primary');

        if (email.archived == false) {
            archive_button.innerHTML = 'Archive';
            archive_button.addEventListener('click', function() {
                fetch(`emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: true
                    })
                })
                .then(() => {load_mailbox('inbox')})
            });

        } else {
            archive_button.innerHTML = 'Unarchive';
            archive_button.addEventListener('click', function() {
                fetch(`emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: false
                    })
                })
                .then(() => {load_mailbox('inbox')})
            });

        }

        // archive/unarchive button not available for sent emails
        if (mailbox != 'sent') {
            document.querySelector('#email-buttons').append(archive_button);
        }

        // Show email view and hide other views
        document.querySelector('#email-view').style.display = 'block';
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
    });
}
