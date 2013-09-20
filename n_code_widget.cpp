#include "n_code_widget.h"
#include "ui_n_code_widget.h"
#include "nutil.h"

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
    menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
    menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
    menu.addAction(tr("&Delete"), this, SLOT(deletePath()));
    menu.addSeparator();
    menu.addAction(tr("&New Directory"), this, SLOT(newDir()));
    menu.exec(QCursor::pos());
}

void NCodeWidget::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::newFile(parentPath, fileName, ".js");
}

void NCodeWidget::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"));
    QString parentPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::newDir(parentPath, dirName);
}

void NCodeWidget::deletePath() {
    QString path = NUtil::selectedPath(ui->codeTreeView);
    NUtil::deletePath(path);
}

void NCodeWidget::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::renamePath(srcPath, newName, ".js");
}

void NCodeWidget::copyPath() {
    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"));
    QString srcPath = NUtil::selectedPath(ui->codeTreeView);
    NUtil::copyPath(srcPath, newName, ".js");
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
