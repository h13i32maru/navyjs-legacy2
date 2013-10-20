#include "n_text_dialog.h"
#include "ui_n_text_dialog.h"

NTextDialog::NTextDialog(QWidget *parent) : QDialog(parent), ui(new Ui::NTextDialog)
{
    ui->setupUi(this);

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(close()));
}

void NTextDialog::setText(QString text) {
    ui->textEdit->setText(text);
}

NTextDialog::~NTextDialog()
{
    delete ui;
}
