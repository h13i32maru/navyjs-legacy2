#include "n_code_widget.h"
#include "ui_n_code_widget.h"

#include <QFileSystemModel>
#include <QDebug>

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
    ui->codeTreeView->setRootIndex(model->index(codeDirPath));
    ui->codeTreeView->hideColumn(1);
    ui->codeTreeView->hideColumn(2);
    ui->codeTreeView->hideColumn(3);
    ui->codeTreeView->hideColumn(4);
}

void NCodeWidget::editCode(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) ui->codeTreeView->model())->filePath(index);
    QFile file(filePath);
    QString fileName = QFileInfo(filePath).fileName();

    if(!file.open(QFile::ReadOnly | QFile::Text)){
        return;
    }

    QTextEdit *textEdit = new QTextEdit();
    textEdit->setText(file.readAll());
    file.close();
    int tabIndex = ui->codeTabWidget->addTab(textEdit, fileName);
    ui->codeTabWidget->setCurrentIndex(tabIndex);
}

NCodeWidget::~NCodeWidget()
{
    delete ui;
}
