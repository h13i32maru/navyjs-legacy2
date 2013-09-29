#include "n_code_widget.h"
#include "ui_n_code_widget.h"
#include "n_file_widget.h";

#include <QDebug>
#include <QFile>
#include <QMessageBox>
#include <QTextEdit>

NCodeWidget::NCodeWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NCodeWidget)
{
    ui->setupUi(this);

    QFile file(filePath);

    if(!file.open(QFile::ReadOnly | QFile::Text)){
        return;
    }

    mTextEdit = ui->textEdit;
    mTextEdit->setText(file.readAll());
    file.close();

    connect(mTextEdit, SIGNAL(textChanged()), this, SLOT(changed()));
}

bool NCodeWidget::save() {
    QFile file(mFilePath);

    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail open file.") + "\n" + mFilePath);
        return false;
    }
    int ret = file.write(mTextEdit->toPlainText().toUtf8());
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + mFilePath);
        return false;
    }

    return true;
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
