#include "n_layout_setting_dialog.h"
#include "ui_n_layout_setting_dialog.h"

#include "n_project.h"

NLayoutSettingDialog::NLayoutSettingDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NLayoutSettingDialog)
{
    ui->setupUi(this);

    ui->screenScene->setList(NProject::instance()->scenes());
    ui->screenPage->setList(NProject::instance()->pages());

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
}

NLayoutSettingDialog::~NLayoutSettingDialog()
{
    delete ui;
}
