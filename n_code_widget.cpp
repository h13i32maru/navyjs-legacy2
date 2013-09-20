#include "n_code_widget.h"
#include "ui_n_code_widget.h"

#include <QFileSystemModel>
#include <QDebug>
#include <QTextEdit>

NCodeWidget::NCodeWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NCodeWidget)
{
    ui->setupUi(this);
    mProjectDir = new QDir(QDir::homePath());
}

void NCodeWidget::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QFileSystemModel *model = new QFileSystemModel;
    QString codeDirPath = mProjectDir->absoluteFilePath("code");
    model->setRootPath(codeDirPath);
    model->setReadOnly(false);
    ui->codeTreeView->setModel(model);
    //特定のディレクトリ以降のみを表示するための設定
    ui->codeTreeView->setRootIndex(model->index(codeDirPath));
    ui->codeTreeView->hideColumn(1);
    ui->codeTreeView->hideColumn(2);
    ui->codeTreeView->hideColumn(3);
    ui->codeTreeView->hideColumn(4);

    ui->codeTabWidget->clear();
}

void NCodeWidget::saveCode() {
    /**
     * TODO: 現在は開いている全てのファイルをほぞんしているが、編集されたものだけを保存するようにすべき。
     * そのためにはファイルが編集されたら何らかの目印を付ける必要がある。
     * 例えばタブ名にアスタリスクをつけるなど.
     */

    int editingCodeNum = ui->codeTabWidget->count();
    for (int i = 0; i < editingCodeNum; i++) {
        QTextEdit *edit = (QTextEdit *)ui->codeTabWidget->widget(i);
        QString text = edit->toPlainText();
        QString filePath = edit->objectName();
        QFile file(filePath);
        if (!file.open(QFile::WriteOnly | QFile::Text)) {
            qDebug() << "fail file open. " + filePath;
            return;
        }
        file.write(text.toUtf8());
    }
}

void NCodeWidget::editCode(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) ui->codeTreeView->model())->filePath(index);
    QFile file(filePath);
    QString fileName = QFileInfo(filePath).fileName();

    if(!file.open(QFile::ReadOnly | QFile::Text)){
        return;
    }

    QTextEdit *textEdit = new QTextEdit();
    textEdit->setObjectName(filePath);
    textEdit->setText(file.readAll());
    file.close();
    int tabIndex = ui->codeTabWidget->addTab(textEdit, fileName);
    ui->codeTabWidget->setCurrentIndex(tabIndex);
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
