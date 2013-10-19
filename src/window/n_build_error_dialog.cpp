#include "n_build_error_dialog.h"
#include "ui_n_build_error_dialog.h"

NBuildErrorDialog::NBuildErrorDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NBuildErrorDialog)
{
    ui->setupUi(this);

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
}

void NBuildErrorDialog::setError(const QStringList &errorList) {
    QString error = errorList.join("\n");
    ui->errorEdit->setText(error);
}

NBuildErrorDialog::~NBuildErrorDialog()
{
    delete ui;
}
