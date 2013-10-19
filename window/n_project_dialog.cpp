#include "n_project_dialog.h"
#include "ui_n_project_dialog.h"

#include <QDebug>

NProjectDialog::NProjectDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NProjectDialog)
{
    ui->setupUi(this);

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
}

void NProjectDialog::syncJsonToWidget() {
    ui->projectNameEdit->setText(mProjectJson.getStr("projectName"));
}

void NProjectDialog::syncWidgetToJson() {
    mProjectJson.set("projectName", ui->projectNameEdit->text());
}

void NProjectDialog::accept() {
    syncWidgetToJson();
    QDialog::accept();
}

void NProjectDialog::setProjectJson(NJson projectJson) {
    mProjectJson = projectJson;

    syncJsonToWidget();
}

NJson NProjectDialog::getProjectJson() const {
    return mProjectJson;
}

NProjectDialog::~NProjectDialog()
{
    delete ui;
}
