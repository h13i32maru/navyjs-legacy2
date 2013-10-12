#include "n_file_opener.h"
#include "ui_n_file_opener.h"

#include "n_project.h"
#include <QDebug>
#include <QDropEvent>

NFileOpener::NFileOpener(QWidget *parent) :
    QDialog(parent),
    ui(new Ui::NFileOpener)
{
    ui->setupUi(this);

    ui->comboBox->setList(NProject::instance()->files());

    QCompleter *completer = ui->comboBox->completer();
    connect(completer, SIGNAL(activated(QString)), this, SLOT(decideFilePath(QString)));
}

void NFileOpener::decideFilePath(const QString &filePath) {
    ui->comboBox->setCurrentText(filePath);
    accept();
}

QString NFileOpener::filePath() const {
    return ui->comboBox->currentText();
}

void NFileOpener::keyPressEvent(QKeyEvent *event) {
    if (event->key() == Qt::Key_Enter || event->key() == Qt::Key_Return) {
        accept();
    } else {
        QDialog::keyPressEvent(event);
    }
}

NFileOpener::~NFileOpener()
{
    delete ui;
}
