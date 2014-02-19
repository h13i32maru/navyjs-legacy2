#include "n_about_dialog.h"
#include "ui_n_about_dialog.h"

#include <n_project.h>
#include <QDebug>

QString NAboutDialog::Version = QString("0.0.1");

NAboutDialog::NAboutDialog(QWidget *parent) : QDialog(parent), ui(new Ui::NAboutDialog)
{
    ui->setupUi(this);

    // navyjs version
    QString jsVersion = "-";
    QFile file(":/misc/version.js");
    if (file.open(QIODevice::ReadOnly | QIODevice::Text)) {
        QString jsText = file.readAll();
        QRegExp regexp("Navy.version = '([0-9.]+)'");
        regexp.indexIn(jsText);
        jsVersion = regexp.cap(1);
    } else {
        qCritical() << "fail open file. :/misc/version.js";
    }
    file.close();

    ui->creatorVersion->setText(Version);
    ui->jsVersion->setText(jsVersion);

    connect(ui->okButton, SIGNAL(clicked()), this, SLOT(accept()));
}

NAboutDialog::~NAboutDialog()
{
    delete ui;
}
