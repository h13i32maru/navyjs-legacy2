#include "n_project_dialog.h"
#include "ui_n_project_dialog.h"

NProjectDialog::NProjectDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NProjectDialog)
{
    ui->setupUi(this);

    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
}

NProjectDialog::~NProjectDialog()
{
    delete ui;
}
