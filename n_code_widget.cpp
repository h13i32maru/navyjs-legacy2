#include "n_code_widget.h"
#include "ui_n_code_widget.h"

#include <QFileSystemModel>
#include <QDebug>
#include <QTextEdit>
#include <QMenu>
#include <QInputDialog>
#include <QMessageBox>

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

void NCodeWidget::contextMenu() {
    QMenu menu(this);
    menu.addAction(tr("&New"), this, SLOT(newFile()));
    menu.addAction(tr("&Move"), this, SLOT(moveFile()));
    menu.addAction(tr("&Copy"), this, SLOT(copyFile()));
    menu.addAction(tr("&Delete"), this, SLOT(deleteFile()));
    menu.addSeparator();
    menu.addAction(tr("&New Directory"), this, SLOT(newDirectory()));
    menu.exec(QCursor::pos());
}

void NCodeWidget::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    if (fileName.contains(QDir::separator())) {
        QMessageBox::critical(this, tr("file name error"), tr("contains directory separator.\n") + fileName);
        return;
    }

    if (fileName.lastIndexOf(".js") == -1) {
        fileName += ".js";
    }

    QFileSystemModel *model = (QFileSystemModel *)ui->codeTreeView->model();
    QModelIndex index = ui->codeTreeView->currentIndex();
    QString dstPath = model->filePath(index);
    QFileInfo dstInfo(dstPath);
    QString filePath;
    if (dstInfo.isDir()) {
        filePath = QDir(dstPath).absoluteFilePath(fileName);
    } else {
        filePath = dstInfo.dir().absoluteFilePath(fileName);
    }

    if (QFile::exists(filePath)) {
        QMessageBox::critical(this, tr("file exists"), tr("file exits.\n") + filePath);
        return;
    }

    QFile file(filePath);
    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        qDebug() << "fail file open. " + filePath;
        return;
    }
}

void NCodeWidget::deleteFile() {
    QFileSystemModel *model = (QFileSystemModel *)ui->codeTreeView->model();
    QModelIndex index = ui->codeTreeView->currentIndex();
    QString dstPath = model->filePath(index);

    int ret = QMessageBox::question(this, tr("delete file"), tr("do you delete this file?") + "\n" + dstPath);
    if (ret != QMessageBox::Yes) {
        return;
    }

    QFileInfo dstInfo(dstPath);
    if (dstInfo.isDir()) {
        QDir(dstPath).removeRecursively();
    } else {
        QFile(dstPath).remove();
    }
}

void NCodeWidget::moveFile() {

}

void NCodeWidget::copyFile() {

}

void NCodeWidget::newDirectory() {

}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
