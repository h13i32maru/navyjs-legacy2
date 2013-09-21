#include "n_file_tab_editor.h"
#include "n_util.h"
#include "ui_n_file_tab_editor.h"

#include <QDir>
#include <QFileSystemModel>
#include <QInputDialog>

NFileTabEditor::NFileTabEditor(QWidget *parent) : QWidget(parent)
{
}
void NFileTabEditor::init(NTreeView *fileTreeView, QTabWidget *fileTabWidget) {
    mFileTreeView = fileTreeView;
    mFileTabWidget = fileTabWidget;
    mProjectDir = new QDir(QDir::homePath());

    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    fileTreeView->setModel(mFileSysteMmodel);
    fileTreeView->hideColumn(1);
    fileTreeView->hideColumn(2);
    fileTreeView->hideColumn(3);
    fileTreeView->hideColumn(4);
}

void NFileTabEditor::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    QString rootDirPath = mProjectDir->absoluteFilePath(mRootDirName);
    mFileSysteMmodel->setRootPath(rootDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    mFileTreeView->setRootIndex(mFileSysteMmodel->index(rootDirPath));

    mFileTabWidget->clear();
}

void NFileTabEditor::newFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"));
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newFile(parentPath, fileName, mFileExtension);
}

NFileTabEditor::~NFileTabEditor()
{
}
