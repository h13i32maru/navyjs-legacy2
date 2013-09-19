#include "edit_json_dialog.h"
#include "ui_edit_json_dialog.h"

EditJsonDialog::EditJsonDialog(QWidget *parent) : QDialog(parent), ui(new Ui::EditJsonDialog)
{
    ui->setupUi(this);
}

void EditJsonDialog::setJsonText(QString text) {
    ui->textEdit->setText(text);
}

EditJsonDialog::~EditJsonDialog()
{
    delete ui;
}
