#include "n_new_project_dialog.h"
#include "ui_n_new_project_dialog.h"

#include <QDir>
#include <QFileDialog>
#include <QDebug>

#include <util/n_util.h>

NNewProjectDialog::NNewProjectDialog(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NNewProjectDialog)
{
    ui->setupUi(this);

    ui->projectNameEdit->setText("New Project");
    ui->projectPathEdit->setText(QDir::homePath() + "/Desktop");

    ui->projectNameEdit->setSelection(0, ui->projectNameEdit->text().length());

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(create()));
    connect(ui->cancelButton, SIGNAL(clicked()), this, SLOT(reject()));
    connect(ui->selectDirButton, SIGNAL(clicked()), this, SLOT(showDirDialog()));
}

QString NNewProjectDialog::projectDirPath() const {
    return mProjectDirPath;
}

void NNewProjectDialog::create() {
    QString projectName = ui->projectNameEdit->text();
    if (projectName.isEmpty()) {
        qDebug() << "project name is empty.";
        return;
    }

    QDir parentDir(ui->projectPathEdit->text());
    if (!parentDir.exists()) {
        qDebug() << "parent dir ist not exists.";
        return;
    }

    QString dirName = QString(projectName).replace(" ", "_");
    QString dirPath = parentDir.absoluteFilePath(dirName);

    // FIXME: remove this debug code.
    if (QFileInfo(dirPath).exists()) {
        if (!QDir(dirPath).removeRecursively()) {
            return;
        }
    }

    NUtil::copyDir(":/template", dirPath);

    mProjectDirPath = dirPath;

    accept();
}

void NNewProjectDialog::showDirDialog() {
    QString dirPath = QFileDialog::getExistingDirectory(this, tr(""), QDir::homePath());
    if (dirPath.isEmpty()) {
        return;
    }

    ui->projectPathEdit->setText(dirPath);
}

NNewProjectDialog::~NNewProjectDialog()
{
    delete ui;
}
